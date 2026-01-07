using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Jits.API.Extensions;

public static class ControllerExtensions
{
    /// <summary>
    /// Gets the current user's ID from JWT claims
    /// </summary>
    public static int? GetCurrentUserId(this ControllerBase controller)
    {
        var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    /// <summary>
    /// Checks if the current user has the Admin role
    /// </summary>
    public static bool IsAdmin(this ControllerBase controller)
    {
        return controller.User.IsInRole("Admin");
    }

    /// <summary>
    /// Checks if the current user owns the resource or is an admin
    /// </summary>
    public static bool IsOwnerOrAdmin(this ControllerBase controller, int resourceOwnerId)
    {
        var currentUserId = controller.GetCurrentUserId();
        return currentUserId == resourceOwnerId || controller.IsAdmin();
    }
}
