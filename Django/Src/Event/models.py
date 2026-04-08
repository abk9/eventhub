from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone


class Event(models.Model):

    STATUS_CHOICES = [
        ('ACTIVE', 'Actif'),
        ('CANCELLED', 'Annulé'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)

    address = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='France')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    participants = models.ManyToManyField('Participant', through='Registration')

    def clean(self):
        if self.end_date and self.end_date <= self.date:
            raise ValidationError("La date de fin doit être après la date de début.")

    @property
    def full_address(self):
        parts = filter(None, [self.country, self.city, self.address])
        return ", ".join(parts)

    @property
    def duration(self):
        """Retourne la durée sous forme de timedelta."""
        if self.end_date and self.date:
            return self.end_date - self.date
        return None

    @property
    def duration_display(self):
        """Retourne la durée lisible ex: '2h 30min'."""
        d = self.duration
        if not d:
            return "Durée non définie"
        total_minutes = int(d.total_seconds() // 60)
        hours, minutes = divmod(total_minutes, 60)
        if hours and minutes:
            return f"{hours}h {minutes}min"
        elif hours:
            return f"{hours}h"
        return f"{minutes}min"

    @property
    def current_status(self):
        """Calcule le statut réel en temps réel pour le frontend React."""
        if self.status == 'CANCELLED':
            return 'CANCELLED'
        now = timezone.now()
        if self.date > now:
            return 'PLANNED'
        elif self.date <= now and (not self.end_date or self.end_date > now):
            return 'ONGOING'
        else:
            return 'COMPLETED'

    def __str__(self):
        return f"{self.title} ({self.date.strftime('%d/%m/%Y')} - {self.full_address})"

    class Meta:
        ordering = ['-date']


class Participant(models.Model):

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='participants')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        ordering = ['last_name', 'first_name']


class Profile(models.Model):

    ROLE_CHOICES = [
        ('viewer', 'Viewer'),
        ('editor', 'Editor'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Registration(models.Model):

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='registrations')
    registered_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def clean(self):
        if self.event.current_status == 'COMPLETED':
            raise ValidationError("Impossible de s'inscrire : cet événement est déjà terminé.")
        if self.event.status == 'CANCELLED':
            raise ValidationError("Impossible de s'inscrire : l'événement a été annulé.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.participant} → {self.event}"

    class Meta:
        unique_together = ('event', 'participant')
        ordering = ['-registered_at']