from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, ParticipantViewSet, RegistrationViewSet, register, logout, me, list_users, update_user_role

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'participants', ParticipantViewSet)
router.register(r'registrations', RegistrationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register),                        # POST → créer un compte
    path('logout/', logout),                            # POST → supprimer le token
    path('me/', me),                                    # GET  → infos + rôle du user connecté
    path('users/', list_users),                         # GET  → liste users (admin)
    path('users/<int:user_id>/role/', update_user_role),# PATCH → changer rôle (admin)
]
