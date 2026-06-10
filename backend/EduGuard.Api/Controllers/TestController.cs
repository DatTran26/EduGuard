using EduGuard.Application.DTOs.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() =>
        Ok(ApiResponse<object>.CreateSuccess(new { message = "EduGuard API is running" }));

    [HttpGet("teacher-only")]
    [Authorize(Roles = "Teacher")]
    public IActionResult TeacherOnly() =>
        Ok(ApiResponse<object>.CreateSuccess(new { message = "Teacher access granted" }));
}

    