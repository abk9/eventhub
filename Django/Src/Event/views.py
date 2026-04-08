from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

from .models import Event, Participant, Registration, Profile
from .serializers import EventSerializer, ParticipantSerializer, RegistrationSerializer
from .permissions import IsOwnerOrAdmin, IsEventOwnerOrAdmin, is_admin


# ─── Auth ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')

    if not username or not password:
        return Response({'error': 'username et password requis'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Cet utilisateur existe déjà'}, status=400)

    user = User.objects.create_user(username=username, password=password, email=email)
    Profile.objects.create(user=user, role='viewer')  # viewer par défaut
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user_id': user.id,
        'username': user.username,
        'role': 'viewer',
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    request.user.auth_token.delete()
    return Response({'message': 'Déconnecté'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    if is_admin(user):
        role = 'admin'
    else:
        profile, _ = Profile.objects.get_or_create(user=user, defaults={'role': 'viewer'})
        role = profile.role

    return Response({
        'user_id': user.id,
        'username': user.username,
        'role': role,
    })


# ─── Admin : gestion des rôles ───────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    """Liste tous les users avec leur rôle — admin uniquement."""
    if not is_admin(request.user):
        raise PermissionDenied("Réservé aux administrateurs.")

    users = User.objects.all().order_by('username')
    data = []
    for u in users:
        if u.is_superuser:
            role = 'admin'
        else:
            profile, _ = Profile.objects.get_or_create(user=u, defaults={'role': 'viewer'})
            role = profile.role
        data.append({
            'user_id': u.id,
            'username': u.username,
            'email': u.email,
            'role': role,
            'is_superuser': u.is_superuser,
        })
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_role(request, user_id):
    """Change le rôle d'un user — admin uniquement."""
    if not is_admin(request.user):
        raise PermissionDenied("Réservé aux administrateurs.")

    new_role = request.data.get('role')
    if new_role not in ('viewer', 'editor'):
        return Response({'error': 'Rôle invalide. Valeurs acceptées : viewer, editor'}, status=400)

    try:
        target = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable.'}, status=404)

    if target.is_superuser:
        return Response({'error': 'Impossible de modifier le rôle d\'un superuser.'}, status=400)

    profile, _ = Profile.objects.get_or_create(user=target, defaults={'role': 'viewer'})
    profile.role = new_role
    profile.save()

    return Response({'user_id': target.id, 'username': target.username, 'role': new_role})


# ─── ViewSets ────────────────────────────────────────────────────────────────

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsOwnerOrAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        queryset = Event.objects.all()
        # Filtrage par status : GET /api/events/?status=ACTIVE
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        # Filtrage par date : GET /api/events/?date=2025-06-01
        date = self.request.query_params.get('date')
        if date:
            try:
                queryset = queryset.filter(date__date=date)
            except (ValueError, Exception):
                pass  # date invalide → filtre ignoré
        return queryset


class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [IsOwnerOrAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsEventOwnerOrAdmin]

    def perform_create(self, serializer):
        event = serializer.validated_data['event']
        # Vérification : l'editor doit être le créateur de l'événement
        if not is_admin(self.request.user) and event.created_by != self.request.user:
            raise PermissionDenied(
                "Vous ne pouvez gérer que les inscriptions de vos propres événements."
            )
        serializer.save()
