from rest_framework import permissions


def is_admin(user):
    return user.is_superuser


def is_editor(user):
    return hasattr(user, 'profile') and user.profile.role == 'editor'


def is_viewer(user):
    return not is_admin(user) and not is_editor(user)


class IsAuthenticatedReadOnly(permissions.BasePermission):
    """
    Viewer : lecture seule.
    Editor/Admin : lecture + écriture.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        # Seuls editor et admin peuvent modifier
        return is_admin(request.user) or is_editor(request.user)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Pour Event et Participant :
    - Viewer : lecture seule
    - Editor : lecture + CRUD sur SES propres objets (created_by == lui)
    - Admin : tout
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_admin(request.user) or is_editor(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if is_admin(request.user):
            return True
        # Editor : seulement ses propres objets
        return getattr(obj, 'created_by', None) == request.user


class IsEventOwnerOrAdmin(permissions.BasePermission):
    """
    Pour Registration :
    - Viewer : lecture seule
    - Editor : peut gérer les inscriptions de SES événements
    - Admin : tout
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_admin(request.user) or is_editor(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if is_admin(request.user):
            return True
        # Editor : seulement si c'est son événement
        return obj.event.created_by == request.user
