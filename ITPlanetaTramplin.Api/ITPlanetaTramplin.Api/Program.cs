using Application.DBContext;
using DTO;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.IdentityModel.Tokens;
using Models;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure.Internal;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------
//  НАСТРОЙКА CORS
// -----------------------------------------

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")  // Порт вашего фронтенда
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();  // ← Разрешить cookies
    });
});

const string SecretKey = "fda7ec31c34c7ce4e82f097efd839657";
var keyBytes = Encoding.UTF8.GetBytes(SecretKey);


// -------------------------------------------
//  НАСТРОКА АВТОРИЗАЦИИ И АУТЕНТИФИКАЦИИ
// -------------------------------------------

builder.Services.AddAuthentication("Bearer").AddJwtBearer(
    options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        };
    }
);

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("requireEmployerRole", policy =>
        policy.RequireClaim(ClaimTypes.Role, "employer"));

    options.AddPolicy("requireCuratorRole", policy =>
        policy.RequireClaim(ClaimTypes.Role, "curator"));

    options.AddPolicy("requireApplicantRole", policy =>
        policy.RequireClaim(ClaimTypes.Role, "applicant"));

});

// -----------------------------------------
//  МАРШРУТИЗАЦИЯ
// -----------------------------------------

var app = builder.Build();

app.UseCors("AllowFrontend");


var api = app.MapGroup("/api");


// --------------------------------
//  МАРШРУТЫ АВТОРИЗАЦИИ
// --------------------------------

api.MapPost("/login/applicant", ([FromBody] DTO.ApplicantLoginDTO userData, HttpContext context) =>
{

    using (var db = new ApplicationDBContext())
    {

        var user = db.Users.Include(u => u.ApplicantProfile).FirstOrDefault(u => u.Email == userData.Login);

        if (user == null || userData.Password != user.PasswordHash || user.ApplicantProfile == null)
        {
            return Results.Unauthorized();
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, "applicant")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        context.Response.Cookies.Append("Authorization", $"Bearer {tokenString}", new CookieOptions
        {
            HttpOnly = true,           
            Secure = false,           
            SameSite = SameSiteMode.None,  
            Path = "/",
            MaxAge = TimeSpan.FromHours(1),
            Domain = null              
        });
        return Results.Ok(new { token = tokenString });

    }
});

api.MapPost("/login/employer", ([FromBody] EmployerLoginDTO userData, HttpContext context) =>
{

    using (var db = new ApplicationDBContext())
    {

        var user = db.Users.Include(u => u.EmployerProfile).FirstOrDefault(u => u.Email == userData.Login);

        if (user == null || userData.Password != user.PasswordHash)
        {
            return Results.Unauthorized();
        }

        if (user.EmployerProfile == null)
        {
            return Results.Forbid();
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, "employer")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        context.Response.Cookies.Append("Authorization", $"Bearer {tokenString}", new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.None,
            Path = "/",
            MaxAge = TimeSpan.FromHours(1),
            Domain = null
        });
        return Results.Ok(new { token = tokenString });

    }
});

api.MapPost("/login/curator", ([FromBody] CuratorLoginDTO userData, HttpContext context) =>
{

    using (var db = new ApplicationDBContext())
    {

        var user = db.Users.Include(u => u.CuratorProfile).FirstOrDefault(u => u.Email == userData.Login);

        if (user == null || userData.Password != user.PasswordHash)
        {
            return Results.Unauthorized();
        }

        if (user.CuratorProfile == null)
        {
            return Results.Forbid();
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, "curator")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        context.Response.Cookies.Append("Authorization", $"Bearer {tokenString}", new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.None,
            Path = "/",
            MaxAge = TimeSpan.FromHours(1),
            Domain = null
        });
        return Results.Ok(new { token = tokenString });

    }
});

// ------------------------------------------
// МАРШРУТЫ РЕГИСТРАЦИИ
// ------------------------------------------

// Регистрация соискателя
api.MapPost("/registration/applicant", ([FromBody] ApplicantRegistrationDTO userData, HttpContext context) =>
{
    try
    {
        using (var db = new ApplicationDBContext())
        {

            var newUser = new Models.User()
            {
                Email = userData.Email,
                PasswordHash = userData.Password,
                ApplicantProfile = new Models.ApplicantProfile()
                {
                    Name = userData.Name,
                    Surname = userData.Surname,
                    Thirdname = userData.Thirdname
                }

            };


            db.Users.Add(newUser);

            db.SaveChanges();

            return Results.Created($"/api/users/{newUser?.Id}", newUser?.Id);

        }
    }
    catch (Exception e)
    {
        Console.WriteLine(e.Message);
        return Results.BadRequest();
    }
});

// Регистрация работодателя
api.MapPost("/registration/employer", ([FromBody] EmployerRegistrationDTO userData, HttpContext context) =>
{
    try
    {
        using (var db = new ApplicationDBContext())
        {



            var newUser = new Models.User()
            {
                Email = userData.Email,
                PasswordHash = userData.Password, // Преобразовать в хэш
                EmployerProfile = new Models.EmployerProfile()
                {
                    CompanyName = userData.CompanyName,
                    Inn = userData.Inn,
                    LegalAddress = userData.LegalAddress,
                }
            };

            db.Users.Add(newUser);

            db.SaveChanges();

            return Results.Created($"/api/users/{newUser?.Id}", newUser?.Id);

        }
    }
    catch (Exception e)
    {
        Console.WriteLine(e.Message);
        Console.WriteLine(e.InnerException);

        return Results.BadRequest();
    }
});

// Регистрация куратора
api.MapPost("/registration/curator", ([FromBody] CuratorRegistrationDTO userData, HttpContext context) =>
{
    return Results.Created();
});

// ---------------------------------------------------
//  УПРАВЛЕНИЕ ДАННЫМИ СОИСКАТЕЛЯ
// ---------------------------------------------------

// Получение данных текущего пользователя
api.MapGet("/applicant", (HttpContext context) =>
{
    var userIdClaim = int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier));

    using (var db = new ApplicationDBContext())
    {
        return Results.Ok(db.ApplicantProfiles
            .Include(ap =>ap.ApplicantEducations)
            .Where(ap => ap.UserId==userIdClaim)
            .Select(ap => new
            {
                ap.Name, ap.Surname, ap.Thirdname,
                Educations=ap.ApplicantEducations.Select(ae => new { ae.InstitutionName, ae.GraduationYear}),
                ap.Description,
                ap.Skills,
            }).ToList()
        );
    }

}).RequireAuthorization("requireApplicantRole");




// ---------------------------------------------------
//  УПРАВЛЕНИЕ ДАННЫМИ РАБОТОДАТЕЛЯ
// ---------------------------------------------------

// Получение списка возможностей конкретного работодателя
api.MapGet("/employer/{employerid}/opportunities", (int employerid) =>
{
    using (var db = new ApplicationDBContext())
    {
        return db.Opportunities
            .Include(o => o.Employer)
            .Where(o => o.EmployerId == employerid)
            .Select(o => new { o.Id, o.Title, o.Longitude, o.Latitude, o.LocationAddress, o.ExpireAt, o.EmploymentType, o.Employer.CompanyName, o.Tags, o.OpportunityType })
            .ToList();
    }
});

// ---------------------------------------------
//  ОБРАЗОВАНИЕ
// ---------------------------------------------

// Добавление записи об образовании
api.MapPost("/applicant/education", (DTO.ApplicantEducationCreateDTO educationData, HttpContext context) =>
{

    var userClaim = int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier));


    using (var db = new ApplicationDBContext())
    {

        var applicantProfile = db.ApplicantProfiles.FirstOrDefault(a => a.UserId == userClaim);

        var education = new ApplicantEducation()
        {
            Applicant = applicantProfile,
            InstitutionName = educationData.InstitutionName,
            Faculty = educationData.Faculty,
            Specialization = educationData.Specialization,
            StartYear = educationData.StartYear,
            GraduationYear = educationData?.GraduationYear,
            IsCompleted = educationData?.IsCompleted,
            Description = educationData?.Description,
        };


        db.ApplicantEducations.Add(education);

        db.SaveChanges();
        return Results.Created($"applicant/education/{education.Id}", education.Id);

    }

}).RequireAuthorization("requireApplicantRole");

// Получение списка записей об образовании соискателя
api.MapGet("/applicant/{applicantid}/education", (int applicantid) =>
{

    using (var db = new ApplicationDBContext())
    {
        var results = db
            .ApplicantEducations
            .Include(ae => ae.Applicant)
            .Where(ae => ae.Applicant.Id == applicantid)
            .Select(ae => new { ae.Id, ae.InstitutionName, ae.Faculty, ae.Specialization, ae.StartYear, ae.GraduationYear, ae.IsCompleted, ae.Description, ae.Attachments })
            .ToList();

        return Results.Ok(results);

    }

});

// Обновление записи об образовании
api.MapPut("/applicant/education", async (DTO.ApplicantEducationUpdateDTO educationData, HttpContext context) =>
{
    var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
    {
        return Results.Unauthorized();
    }

    using (var db = new ApplicationDBContext())
    {
        var applicantProfile = await db.ApplicantProfiles
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (applicantProfile == null)
        {
            return Results.NotFound();
        }

        var education = await db.ApplicantEducations
            .FirstOrDefaultAsync(e => e.Id == educationData.Id && e.ApplicantId == applicantProfile.Id);

        if (education == null)
        {
            return Results.NotFound();
        }

        if (educationData.InstitutionName != null)
            education.InstitutionName = educationData.InstitutionName;

        if (educationData.Faculty != null)
            education.Faculty = educationData.Faculty;

        if (educationData.Specialization != null)
            education.Specialization = educationData.Specialization;

        if (educationData.StartYear.HasValue)
            education.StartYear = educationData.StartYear;

        if (educationData.GraduationYear.HasValue)
            education.GraduationYear = educationData.GraduationYear;

        if (educationData.IsCompleted.HasValue)
            education.IsCompleted = educationData.IsCompleted;

        if (educationData.Description != null)
            education.Description = educationData.Description;

        if (educationData.Attachments != null)
            education.Attachments = educationData.Attachments;

        await db.SaveChangesAsync();

        return Results.Ok( new DTO.ApplicantEducationReadDTO(){ 
            Id=education.Id,
            InstitutionName=education.InstitutionName,
            Faculty=education.Faculty,
            Specialization=education.Specialization,
            StartYear=education.StartYear,
            GraduationYear=education.GraduationYear,
            IsCompleted=education.IsCompleted,
            Description=education.Description,
        });
    }
}).RequireAuthorization("requireApplicantRole");

// Удаление записи об образовании
api.MapDelete("/applicant/education/{educationid}", async (int educationid, HttpContext context) =>
{
    var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
    {
        return Results.Unauthorized();
    }

    using (var db = new ApplicationDBContext())
    {
        var applicantProfile = await db.ApplicantProfiles
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (applicantProfile == null)
        {
            return Results.NotFound();
        }

        var education = await db.ApplicantEducations
            .FirstOrDefaultAsync(e => e.Id == educationid);

        db.ApplicantEducations.Remove(education);
      

        await db.SaveChangesAsync();

        return Results.Ok();
    }
}).RequireAuthorization("requireApplicantRole");

// --------------------------------------------------
//  ДОСТИЖЕНИЯ
// --------------------------------------------------

// Добавление записи о достижении
api.MapPost("/applicant/achievement", (DTO.ApplicantAchievementCreateDTO achievementData, HttpContext context) =>
{

    var userClaim = int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier));

    using (var db = new ApplicationDBContext())
    {

        var applicantProfile = db.ApplicantProfiles.FirstOrDefault(a => a.UserId == userClaim);

        var achievement = new Models.ApplicantAchievement()
        {
            Applicant = applicantProfile,
            Description = achievementData?.Description,
            Title = achievementData?.Title,
            Location = achievementData?.Location,
            ObtainDate = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(achievementData.ObtainDate ?? 0).DateTime),
        };

        db.ApplicantAchievements.Add(achievement);

        db.SaveChanges();
        return Results.Created($"applicant/achievement/{achievement.Id}", achievement.Id);
    }

}).RequireAuthorization("requireApplicantRole");

// Получение списка записей о достижениях
api.MapGet("/applicant/{applicantid}/achievement", (int applicantid) =>
{

    using (var db = new ApplicationDBContext())
    {
        var results = db
            .ApplicantAchievements
            .Include(ae => ae.Applicant)
            .Where(ae => ae.Applicant.Id == applicantid)
            .Select(ae => new { ae.Id, ae.ObtainDate, ae.Location, ae.Title, ae.Description, ae.Attachments})
            .ToList();

        return Results.Ok(results);

    }

});

// Обновление записи о достижении
api.MapPut("/applicant/achievement", async (DTO.ApplicantAchievementUpdateDTO achievementData, HttpContext context) =>
{
    var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
    {
        return Results.Unauthorized();
    }

    using (var db = new ApplicationDBContext())
    {
        var applicantProfile = await db.ApplicantProfiles
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (applicantProfile == null)
        {
            return Results.NotFound();
        }

        var achievement = await db.ApplicantAchievements
            .FirstOrDefaultAsync(a => a.Id == achievementData.Id && a.ApplicantId == applicantProfile.Id);

        if (achievement == null)
        {
            return Results.NotFound();
        }

        if (achievementData.Title != null)
            achievement.Title = achievementData.Title;

        if (achievementData.Location != null)
            achievement.Location = achievementData.Location;

        if (achievementData.Description != null)
            achievement.Description = achievementData.Description;

        if (achievementData.ObtainDate.HasValue)
            achievement.ObtainDate = DateOnly.FromDateTime(
                DateTimeOffset.FromUnixTimeSeconds(achievementData.ObtainDate.Value).DateTime);

        if (achievementData.Attachments != null)
            achievement.Attachments = achievementData.Attachments;

        await db.SaveChangesAsync();

        return Results.Ok(new DTO.ApplicantAchievementReadDTO
        {
            Id = achievement.Id,
            ApplicantId = achievement.ApplicantId,
            Title = achievement.Title,
            Location = achievement.Location,
            ObtainDate = achievement.ObtainDate,
            Description = achievement.Description,
            Attachments = achievement.Attachments,
        });
    }
}).RequireAuthorization("requireApplicantRole");

// Удаление записи об образовании
api.MapDelete("/applicant/achievement/{achievementid}", async (int achievementid, HttpContext context) =>
{
    var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
    {
        return Results.Unauthorized();
    }

    using (var db = new ApplicationDBContext())
    {
        var applicantProfile = await db.ApplicantProfiles
            .FirstOrDefaultAsync(a => a.UserId == userId);

        if (applicantProfile == null)
        {
            return Results.NotFound();
        }

        var achievement = await db.ApplicantAchievements
            .FirstOrDefaultAsync(e => e.Id == achievementid);

        db.ApplicantAchievements.Remove(achievement);


        await db.SaveChangesAsync();

        return Results.Ok();
    }
}).RequireAuthorization("requireApplicantRole");


// ---------------------------------------------------
//  УПРАВЛЕНИЕ КАРТОЧКАМИ ВОЗМОЖНОСТЕЙ
// ---------------------------------------------------

// СОЗДАНИЕ НОВОЙ ВОЗМОЖНОСТИ
api.MapPost("/opportunities", ([FromBody] DTO.OpportunityPostDTO opportunityData, HttpContext context) =>
{

    using (var db = new ApplicationDBContext())
    {

        var user = db.EmployerProfiles.FirstOrDefault(u => u.UserId == int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)));

        var newOpportunity = new Models.Opportunity()
        {
            Title = opportunityData.Title,
            Description = opportunityData.Description ?? "",
            LocationAddress = opportunityData.LocationAddress,
            ExpireAt = DateOnly.FromDateTime(DateTimeOffset.FromUnixTimeSeconds(opportunityData.ExpireAt ?? 0).DateTime),
            Employer = user,
            OpportunityType = opportunityData.OpportunityType,

        };


        db.Opportunities.Add(newOpportunity);
        db.SaveChanges();

        return Results.Created($"/opportunities/{newOpportunity.Id}", newOpportunity.Id);

    }

}).RequireAuthorization("requireEmployerRole");

// УДАЛЕНИЕ ВОЗМОЖНОСТИ
api.MapDelete("/opportunities/{id}", ([FromBody] DTO.OpportunityDeleteDTO opportunityData, HttpContext context) =>
{

    using (var db = new ApplicationDBContext())
    {

        var userClaim = db.EmployerProfiles.FirstOrDefault(u => u.UserId == int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)));

        var opportunity = db.Opportunities.FirstOrDefault(o => o.Id == opportunityData.Id && userClaim.Id==o.EmployerId);

        opportunity.DeletedAt = DateOnly.FromDateTime(DateTime.Now);
       
        db.SaveChanges();

        return Results.Ok(opportunity);

    }

}).RequireAuthorization("requireEmployerRole");


// РЕДАКТИРОВАНИЕ ВОЗМОЖНОСТИ
api.MapPut("/opportunities/", ([FromBody] DTO.OpportunityUpdateDTO opportunityData, HttpContext context) =>
{
    using (var db = new ApplicationDBContext())
    {
        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Results.Unauthorized();
        }

        var user = db.EmployerProfiles.FirstOrDefault(u => u.UserId == userId);
        if (user == null)
        {
            return Results.NotFound("Профиль работодателя не найден");
        }

        var opportunity = db.Opportunities.FirstOrDefault(o =>
            o.Id == opportunityData.Id && o.EmployerId == user.Id);

        if (opportunity == null)
        {
            return Results.NotFound("Вакансия не найдена или доступ запрещен");
        }

        if (opportunityData.Title != null)
            opportunity.Title = opportunityData.Title;

        if (opportunityData.Description != null)
            opportunity.Description = opportunityData.Description;

        if (opportunityData.LocationAddress != null)
            opportunity.LocationAddress = opportunityData.LocationAddress;

        if (opportunityData.LocationCity != null)
            opportunity.LocationCity = opportunityData.LocationCity;

        if (opportunityData.ExpireAt.HasValue)
            opportunity.ExpireAt = DateOnly.FromDateTime(
                DateTimeOffset.FromUnixTimeSeconds(opportunityData.ExpireAt.Value).DateTime);

        if (opportunityData.ContactsJson != null)
            opportunity.ContactsJson = opportunityData.ContactsJson;

        if (opportunityData.MediaContentJson != null)
            opportunity.MediaContentJson = opportunityData.MediaContentJson;

        if (opportunityData.Tags != null)
            opportunity.Tags = opportunityData.Tags;

        db.SaveChanges();

        return Results.Ok();
    }
}).RequireAuthorization("requireEmployerRole");


// МАССОВОЕ ПОЛУЧЕНИЕ ПРЕВЬЮ ВОЗМОЖНОСТЕЙ
api.MapGet("/opportunities", () =>
{

    using (var db = new ApplicationDBContext())
    {
        return db.Opportunities
            .Include(o => o.Employer)
            .Select(o => new { o.Id, o.Title, o.Longitude, o.Latitude, o.LocationAddress, o.ExpireAt, o.EmploymentType, o.Employer.CompanyName, o.Tags, o.OpportunityType})
            .ToList();
    }
});

// ПОЛУЧЕНИЕ ДЕТАЛЬНЫХ ДАННЫХ ВОЗМОЖНОСТИ
api.MapGet("/opportunities/{id}", (int id) =>
{
    using (var db = new ApplicationDBContext())
    {
        return db.Opportunities.FirstOrDefault(o => o.Id == id);
    }

});

// ОТКЛИК НА ВОЗМОЖНОСТЬ
api.MapPost("/opportunities/applications", (DTO.OpportunityApplicationDTO opportunityApplicationData,  HttpContext context) =>
{
    using (var db = new ApplicationDBContext())
    {
        var user = db.ApplicantProfiles
            .FirstOrDefault(u => u.UserId == int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)));

        var opportunity = db.Opportunities
            .FirstOrDefault(o => o.Id == opportunityApplicationData.opportunityId);

        Console.WriteLine(user.Id);
        Console.WriteLine(opportunity.Id);

        if (user != null && opportunity != null)
        {
            db.Applications.Add(new Models.OpportunityApplication()
            {
                Opportunity = opportunity,
                Applicant = user,
            });
        }

        db.SaveChanges();
        return Results.Ok();
    }
}).RequireAuthorization("requireApplicantRole");

// Получение списка откликов на возможность
api.MapGet("/opportunities/{opportunityid}/applications", (int opportunityid) =>
{
    using (var db = new ApplicationDBContext())
    {
        return Results.Ok(db.Applications
            .Where(a => a.OpportunityId == opportunityid)
            .Select(a => new { a.OpportunityId, a.ApplicantId, a.AppliedAt})
            .ToList());
    }
});

// -----------------------------------------------
//  КОНТАКТЫ
// -----------------------------------------------

// Добавление нового контакта
api.MapPost("/contact", (DTO.ContactCreateDTO contact, HttpContext context) =>
    {
        var userClaim = int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier));

        using (var db = new ApplicationDBContext())
        {

            if (userClaim == contact.UserId) return Results.BadRequest();

            var applicant = db.ApplicantProfiles.Include(a =>a.User).FirstOrDefault(a => a.UserId == userClaim);
            var contactApplicant = db.ApplicantProfiles.Include(a => a.User).FirstOrDefault(u => u.UserId == contact.UserId);


            if (applicant == null || contactApplicant == null)
            {
                Console.WriteLine(applicant == null);
                Console.WriteLine(contactApplicant == null);
                

                return Results.NotFound();
            }

            db.Contacts.Add(new Models.Contact()
            {
                User = applicant.User,
                ContactProfile = contactApplicant.User
            });

            db.SaveChanges();
            return Results.Ok();
        }
    }).RequireAuthorization("requireApplicantRole");

// Удаление контакта
api.MapDelete("/contact/{contactid}", (int contactid, HttpContext context) =>
{
    var userClaim = int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier));

    using (var db = new ApplicationDBContext())
    {
        var contact = db.Contacts.FirstOrDefault(c => c.UserId == userClaim && c.ContactProfileId == contactid);


        if (contact == null)
        {
            return Results.NotFound();
        }

        db.Contacts.Remove(contact);

        db.SaveChanges();
        return Results.Ok();

    }
}).RequireAuthorization("requireApplicantRole");

// Получение списка контактов пользователю
api.MapGet("/applicant/{userid}/contact", (int userid) =>
{
    using (var db = new ApplicationDBContext())
    {
        return db.Contacts.Include(c => c.ContactProfile).Where(c => c.UserId==userid).ToList();
    }
});

// Отправить рекомендацию пользователю
api.MapPost("/recommendation", (DTO.RecommendationCreateDTO recommendation, HttpContext context) =>
{
    var recommenderClaim = int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier));
    using (var db = new ApplicationDBContext())
    {
        var recommender = db.ApplicantProfiles.FirstOrDefault(ap => ap.UserId==recommenderClaim);
        var candidate = db.ApplicantProfiles.FirstOrDefault(ap => ap.UserId == recommendation.CandidateId);
        var opportunity = db.Opportunities.FirstOrDefault(o => o.Id == recommendation.OpportunityId);

        if (recommender == null || candidate == null || opportunity == null) return Results.NotFound();

        db.Recommendations.Add(new Models.Recommendation()
        {
            Recommender = recommender,
            Candidate = candidate,
            Opportunity = opportunity,
            Message = recommendation.Message
        });

        db.SaveChanges();
        return Results.Ok();

    }
}).RequireAuthorization("requireApplicantRole");

// Список полученных рекомендаций
api.MapGet("/recommendation", (HttpContext context) =>
{
    var userClaim = int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier));
    
    using (var db = new ApplicationDBContext())
    {
        var user = db.ApplicantProfiles.FirstOrDefault(u => u.UserId == userClaim);

        if (user == null) return Results.Unauthorized();

        return Results.Ok(db.Recommendations
            .Where(r => r.Candidate==user)
            .Select(r => new {
                // Какие поля передавать в списке рекомендаций?
                RecommenderId=r.Recommender.Id,
                OpportunityId=r.Opportunity.Id, 
                r.Message, 
                r.CreatedAt 
            })
            .ToList());
    }


}).RequireAuthorization("requireApplicantRole");


app.UseAuthentication();
app.UseAuthorization();

app.Run();

