from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from datetime import timedelta

from .models import Event, Participant, Registration, Profile


# ─── Helpers ─────────────────────────────────────────────────────────────────

def make_user(username, role='viewer', is_superuser=False):
    """Crée un user avec son Profile et son Token."""
    user = User.objects.create_user(username=username, password='pass1234')
    if is_superuser:
        user.is_superuser = True
        user.is_staff = True
        user.save()
    else:
        Profile.objects.create(user=user, role=role)
    Token.objects.get_or_create(user=user)
    return user


def auth_client(user):
    """Retourne un APIClient authentifié avec le token du user."""
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {user.auth_token.key}')
    return client


def make_event(user, title='Test Event', days_from_now=7):
    """Crée un event futur appartenant à user."""
    return Event.objects.create(
        title=title,
        date=timezone.now() + timedelta(days=days_from_now),
        created_by=user,
    )


def make_participant(user=None, email='p@test.com'):
    """Crée un participant."""
    return Participant.objects.create(
        first_name='Alice',
        last_name='Martin',
        email=email,
        created_by=user,
    )


# ─── 1. Tests Modèles ─────────────────────────────────────────────────────────

class EventModelTest(TestCase):

    def setUp(self):
        self.user = make_user('editor1', role='editor')

    def test_current_status_planned(self):
        event = make_event(self.user, days_from_now=5)
        self.assertEqual(event.current_status, 'PLANNED')

    def test_current_status_ongoing(self):
        event = Event.objects.create(
            title='En cours',
            date=timezone.now() - timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=1),
            created_by=self.user,
        )
        self.assertEqual(event.current_status, 'ONGOING')

    def test_current_status_completed(self):
        event = Event.objects.create(
            title='Terminé',
            date=timezone.now() - timedelta(days=2),
            end_date=timezone.now() - timedelta(days=1),
            created_by=self.user,
        )
        self.assertEqual(event.current_status, 'COMPLETED')

    def test_current_status_cancelled(self):
        event = make_event(self.user)
        event.status = 'CANCELLED'
        event.save()
        self.assertEqual(event.current_status, 'CANCELLED')

    def test_duration_display(self):
        event = Event.objects.create(
            title='Avec durée',
            date=timezone.now() + timedelta(days=1),
            end_date=timezone.now() + timedelta(days=1, hours=2, minutes=30),
            created_by=self.user,
        )
        self.assertEqual(event.duration_display, '2h 30min')

    def test_duration_display_no_end(self):
        event = make_event(self.user)
        self.assertEqual(event.duration_display, 'Durée non définie')

    def test_full_address(self):
        event = Event.objects.create(
            title='Adresse',
            date=timezone.now() + timedelta(days=1),
            address='10 rue de la Paix',
            city='Paris',
            country='France',
            created_by=self.user,
        )
        self.assertIn('Paris', event.full_address)
        self.assertIn('France', event.full_address)

    def test_str(self):
        event = make_event(self.user, title='MonEvent')
        self.assertIn('MonEvent', str(event))


class RegistrationModelTest(TestCase):

    def setUp(self):
        self.user = make_user('editor2', role='editor')
        self.event = make_event(self.user)
        self.participant = make_participant(self.user, email='r@test.com')

    def test_registration_ok(self):
        reg = Registration(event=self.event, participant=self.participant)
        reg.save()
        self.assertEqual(Registration.objects.count(), 1)

    def test_double_registration_blocked(self):
        from django.core.exceptions import ValidationError
        Registration.objects.create(event=self.event, participant=self.participant)
        with self.assertRaises(ValidationError):
            Registration.objects.create(event=self.event, participant=self.participant)

    def test_registration_cancelled_event_blocked(self):
        from django.core.exceptions import ValidationError
        self.event.status = 'CANCELLED'
        self.event.save()
        reg = Registration(event=self.event, participant=self.participant)
        with self.assertRaises(ValidationError):
            reg.save()

    def test_registration_completed_event_blocked(self):
        from django.core.exceptions import ValidationError
        completed_event = Event.objects.create(
            title='Passé',
            date=timezone.now() - timedelta(days=2),
            end_date=timezone.now() - timedelta(days=1),
            created_by=self.user,
        )
        reg = Registration(event=completed_event, participant=self.participant)
        with self.assertRaises(ValidationError):
            reg.save()


# ─── 2. Tests Authentification ────────────────────────────────────────────────

class AuthTest(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_register_creates_viewer(self):
        res = self.client.post('/api/register/', {
            'username': 'newuser',
            'password': 'pass1234',
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['role'], 'viewer')
        self.assertIn('token', res.data)

    def test_register_duplicate_username(self):
        make_user('existing')
        res = self.client.post('/api/register/', {
            'username': 'existing',
            'password': 'pass1234',
        })
        self.assertEqual(res.status_code, 400)

    def test_register_missing_fields(self):
        res = self.client.post('/api/register/', {'username': 'only'})
        self.assertEqual(res.status_code, 400)

    def test_login_returns_token(self):
        make_user('loginuser')
        res = self.client.post('/api/token/', {
            'username': 'loginuser',
            'password': 'pass1234',
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn('token', res.data)

    def test_logout_deletes_token(self):
        user = make_user('logoutuser')
        client = auth_client(user)
        res = client.post('/api/logout/')
        self.assertEqual(res.status_code, 200)
        # Le token ne doit plus exister
        self.assertFalse(Token.objects.filter(user=user).exists())

    def test_me_returns_role(self):
        user = make_user('meuser', role='editor')
        client = auth_client(user)
        res = client.get('/api/me/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['role'], 'editor')

    def test_me_admin_role(self):
        admin = make_user('adminuser', is_superuser=True)
        client = auth_client(admin)
        res = client.get('/api/me/')
        self.assertEqual(res.data['role'], 'admin')

    def test_unauthenticated_blocked(self):
        res = self.client.get('/api/events/')
        self.assertEqual(res.status_code, 401)


# ─── 3. Tests Permissions Events ─────────────────────────────────────────────

class EventPermissionsTest(TestCase):

    def setUp(self):
        self.viewer = make_user('viewer1', role='viewer')
        self.editor = make_user('editor1', role='editor')
        self.editor2 = make_user('editor2', role='editor')
        self.admin = make_user('admin1', is_superuser=True)

    def test_viewer_can_list_events(self):
        client = auth_client(self.viewer)
        res = client.get('/api/events/')
        self.assertEqual(res.status_code, 200)

    def test_viewer_cannot_create_event(self):
        client = auth_client(self.viewer)
        res = client.post('/api/events/', {
            'title': 'Event Viewer',
            'date': (timezone.now() + timedelta(days=5)).isoformat(),
        })
        self.assertEqual(res.status_code, 403)

    def test_editor_can_create_event(self):
        client = auth_client(self.editor)
        res = client.post('/api/events/', {
            'title': 'Event Editor',
            'date': (timezone.now() + timedelta(days=5)).isoformat(),
        })
        self.assertEqual(res.status_code, 201)
        # created_by doit être l'editor, pas manipulable
        self.assertEqual(res.data['created_by'], self.editor.id)

    def test_editor_can_update_own_event(self):
        event = make_event(self.editor, title='Original')
        client = auth_client(self.editor)
        res = client.patch(f'/api/events/{event.id}/', {'title': 'Modifié'})
        self.assertEqual(res.status_code, 200)

    def test_editor_cannot_update_other_event(self):
        event = make_event(self.editor2, title='Event editor2')
        client = auth_client(self.editor)
        res = client.patch(f'/api/events/{event.id}/', {'title': 'Piratage'})
        self.assertEqual(res.status_code, 403)

    def test_editor_can_delete_own_event(self):
        event = make_event(self.editor)
        client = auth_client(self.editor)
        res = client.delete(f'/api/events/{event.id}/')
        self.assertEqual(res.status_code, 204)

    def test_admin_can_update_any_event(self):
        event = make_event(self.editor)
        client = auth_client(self.admin)
        res = client.patch(f'/api/events/{event.id}/', {'title': 'Admin edit'})
        self.assertEqual(res.status_code, 200)


# ─── 4. Tests Permissions Participants ────────────────────────────────────────

class ParticipantPermissionsTest(TestCase):

    def setUp(self):
        self.viewer = make_user('viewer2', role='viewer')
        self.editor = make_user('editor3', role='editor')
        self.editor2 = make_user('editor4', role='editor')
        self.admin = make_user('admin2', is_superuser=True)

    def test_viewer_can_list_participants(self):
        client = auth_client(self.viewer)
        res = client.get('/api/participants/')
        self.assertEqual(res.status_code, 200)

    def test_viewer_cannot_create_participant(self):
        client = auth_client(self.viewer)
        res = client.post('/api/participants/', {
            'first_name': 'Test', 'last_name': 'User', 'email': 'test@test.com'
        })
        self.assertEqual(res.status_code, 403)

    def test_editor_can_create_participant(self):
        client = auth_client(self.editor)
        res = client.post('/api/participants/', {
            'first_name': 'Bob', 'last_name': 'Dupont', 'email': 'bob@test.com'
        })
        self.assertEqual(res.status_code, 201)

    def test_editor_can_update_own_participant(self):
        p = make_participant(self.editor, email='own@test.com')
        client = auth_client(self.editor)
        res = client.patch(f'/api/participants/{p.id}/', {'phone': '0600000000'})
        self.assertEqual(res.status_code, 200)

    def test_editor_cannot_update_other_participant(self):
        p = make_participant(self.editor2, email='other@test.com')
        client = auth_client(self.editor)
        res = client.patch(f'/api/participants/{p.id}/', {'phone': '0600000000'})
        self.assertEqual(res.status_code, 403)

    def test_admin_can_update_any_participant(self):
        p = make_participant(self.editor, email='any@test.com')
        client = auth_client(self.admin)
        res = client.patch(f'/api/participants/{p.id}/', {'phone': '0611111111'})
        self.assertEqual(res.status_code, 200)


# ─── 5. Tests Registrations ───────────────────────────────────────────────────

class RegistrationAPITest(TestCase):

    def setUp(self):
        self.viewer = make_user('viewer3', role='viewer')
        self.editor = make_user('editor5', role='editor')
        self.editor2 = make_user('editor6', role='editor')
        self.admin = make_user('admin3', is_superuser=True)
        self.event = make_event(self.editor)
        self.participant = make_participant(self.editor, email='reg@test.com')

    def test_viewer_cannot_create_registration(self):
        client = auth_client(self.viewer)
        res = client.post('/api/registrations/', {
            'event': self.event.id,
            'participant': self.participant.id,
        })
        self.assertEqual(res.status_code, 403)

    def test_editor_can_register_participant_to_own_event(self):
        client = auth_client(self.editor)
        res = client.post('/api/registrations/', {
            'event': self.event.id,
            'participant': self.participant.id,
        })
        self.assertEqual(res.status_code, 201)

    def test_editor_cannot_register_to_other_event(self):
        other_event = make_event(self.editor2, title='Event editor2')
        client = auth_client(self.editor)
        res = client.post('/api/registrations/', {
            'event': other_event.id,
            'participant': self.participant.id,
        })
        self.assertEqual(res.status_code, 403)

    def test_double_registration_blocked_by_api(self):
        client = auth_client(self.editor)
        client.post('/api/registrations/', {
            'event': self.event.id,
            'participant': self.participant.id,
        })
        res = client.post('/api/registrations/', {
            'event': self.event.id,
            'participant': self.participant.id,
        })
        self.assertIn(res.status_code, [400, 409])

    def test_registration_to_cancelled_event_blocked(self):
        self.event.status = 'CANCELLED'
        self.event.save()
        client = auth_client(self.editor)
        res = client.post('/api/registrations/', {
            'event': self.event.id,
            'participant': self.participant.id,
        })
        self.assertEqual(res.status_code, 400)

    def test_admin_can_register_to_any_event(self):
        p2 = make_participant(self.admin, email='adminreg@test.com')
        client = auth_client(self.admin)
        res = client.post('/api/registrations/', {
            'event': self.event.id,
            'participant': p2.id,
        })
        self.assertEqual(res.status_code, 201)


# ─── 6. Tests Filtrage Events ─────────────────────────────────────────────────

class EventFilterTest(TestCase):

    def setUp(self):
        self.editor = make_user('editor7', role='editor')
        self.client = auth_client(self.editor)
        make_event(self.editor, title='Actif')
        cancelled = make_event(self.editor, title='Annulé')
        cancelled.status = 'CANCELLED'
        cancelled.save()

    def test_filter_by_status_active(self):
        res = self.client.get('/api/events/?status=ACTIVE')
        self.assertEqual(res.status_code, 200)
        for event in res.data:
            self.assertEqual(event['status'], 'ACTIVE')

    def test_filter_by_status_cancelled(self):
        res = self.client.get('/api/events/?status=CANCELLED')
        self.assertEqual(res.status_code, 200)
        for event in res.data:
            self.assertEqual(event['status'], 'CANCELLED')

    def test_filter_by_invalid_date_does_not_crash(self):
        res = self.client.get('/api/events/?date=not-a-date')
        # Ne doit pas crasher, retourne 200 ou 400 mais jamais 500
        self.assertNotEqual(res.status_code, 500)
