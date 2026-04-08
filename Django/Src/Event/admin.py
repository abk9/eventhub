from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Event, Participant, Registration, Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name = 'Profil'


class CustomUserAdmin(UserAdmin):
    inlines = [ProfileInline]


# Remplace l'admin User par défaut pour y inclure le Profile
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username',)
    # Permet à l'admin de changer le rôle directement depuis la liste
    list_editable = ('role',)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'end_date', 'status', 'get_current_status', 'city', 'created_by')
    list_filter = ('status', 'city', 'date')
    search_fields = ('title', 'city')
    readonly_fields = ('created_at', 'updated_at')

    @admin.display(description='Statut calculé')
    def get_current_status(self, obj):
        return obj.current_status


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'email', 'phone', 'created_by')
    search_fields = ('last_name', 'email')


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('event', 'participant', 'registered_at')
    list_filter = ('event', 'registered_at')
    search_fields = ('participant__last_name', 'event__title')
