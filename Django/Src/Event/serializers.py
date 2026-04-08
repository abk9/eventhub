from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Event, Participant, Registration, Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['role']


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']


class RegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source='event.title')
    participant_name = serializers.ReadOnlyField(source='participant.last_name')

    class Meta:
        model = Registration
        fields = '__all__'

    def validate(self, data):
        event = data['event']
        if event.current_status == 'COMPLETED':
            raise serializers.ValidationError(
                {"event": "Impossible de s'inscrire : l'événement est déjà terminé."}
            )
        if event.status == 'CANCELLED':
            raise serializers.ValidationError(
                {"event": "Impossible de s'inscrire : l'événement est annulé."}
            )
        return data


class EventSerializer(serializers.ModelSerializer):
    current_status = serializers.ReadOnlyField()
    duration_display = serializers.ReadOnlyField()
    full_address = serializers.ReadOnlyField()
    participants_count = serializers.IntegerField(source='participants.count', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'date', 'end_date',
            'address', 'city', 'country', 'status',
            'current_status', 'duration_display', 'full_address',
            'participants_count', 'created_by',
        ]
        read_only_fields = ['created_by']
