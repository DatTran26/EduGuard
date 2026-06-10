using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok(new { message = "EduGuard API is running" });
        
    }
}
    