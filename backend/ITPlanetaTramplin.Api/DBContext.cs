using System;
using System.Collections.Generic;
using ITPlanetaTramplin.Api.Domain;
using Models;
using Microsoft.EntityFrameworkCore;

namespace Application.DBContext;

public partial class ApplicationDBContext : DbContext
{
    public ApplicationDBContext(DbContextOptions<ApplicationDBContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ApplicantAchievement> ApplicantAchievements { get; set; }

    public virtual DbSet<ApplicantEducation> ApplicantEducations { get; set; }

    public virtual DbSet<ApplicantProfile> ApplicantProfiles { get; set; }

    public virtual DbSet<AiCareerCache> AiCareerCaches { get; set; }

    public virtual DbSet<CandidateProject> CandidateProjects { get; set; }

    public virtual DbSet<CandidateProjectInvite> CandidateProjectInvites { get; set; }

    public virtual DbSet<ChatMessage> ChatMessages { get; set; }

    public virtual DbSet<ChatParticipant> ChatParticipants { get; set; }

    public virtual DbSet<ChatThread> ChatThreads { get; set; }

    public virtual DbSet<OpportunityApplication> Applications { get; set; }

    public virtual DbSet<Complaint> Complaints { get; set; }

    public virtual DbSet<Contact> Contacts { get; set; }

    public virtual DbSet<FriendRequest> FriendRequests { get; set; }

    public virtual DbSet<CuratorProfile> CuratorProfiles { get; set; }

    public virtual DbSet<EmployerProfile> EmployerProfiles { get; set; }
    public virtual DbSet<CompanySetting> CompanySettings { get; set; }

    public virtual DbSet<ModeratorInvitation> ModeratorInvitations { get; set; }

    public virtual DbSet<ModeratorSetting> ModeratorSettings { get; set; }

    public virtual DbSet<ModerationAuditLog> ModerationAuditLogs { get; set; }

    public virtual DbSet<Opportunity> Opportunities { get; set; }

    public virtual DbSet<OpportunityShare> OpportunityShares { get; set; }

    public virtual DbSet<Recommendation> Recommendations { get; set; }

    public virtual DbSet<Tag> Tags { get; set; }

    public virtual DbSet<SystemReferenceItem> SystemReferenceItems { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserNotification> UserNotifications { get; set; }

    public virtual DbSet<VApplicantStat> VApplicantStats { get; set; }

    public virtual DbSet<VEmployerStat> VEmployerStats { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var isNpgsqlProvider = Database.ProviderName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true;

        //modelBuilder
        //    .HasPostgresEnum("employer_verification_status", new[] { "На рассмотрении", "Отклонен", "Верифицирован" })
        //    .HasPostgresEnum("application_status_enum", new[] { "Новый", "Просмотрен", "Принят", "Отклонен" })
        //    .HasPostgresEnum("business_field_enum", new[] { "IT", "Финансы", "Маркетинг", "Образование", "Производство", "Ритейл", "Медицина", "Медиа", "Госсектор", "Другое" })
        //    .HasPostgresEnum("education_grade_enum", new[] { "Среднее общее", "Среднее специальное", "Бакалавриат", "Специалитет", "Магистратура" })
        //    .HasPostgresEnum("employment_type_enum", new[] { "Полная", "Частичная", "Проектная работа" })
        //    .HasPostgresEnum("opportunity_status_enum", new[] { "Активен", "Завершен", "Черновик", "Модерация" })
        //    .HasPostgresEnum("opportunity_type_enum", new[] { "Стажировка", "Вакансия", "Менторская программа", "Карьерное мероприятие" })
        //    .HasPostgresEnum("tag_category_enum", new[] { "Технология", "Уровень", "Тип занятости" })
        //    .HasPostgresEnum("user_role_enum", new[] { "Соискатель", "Работодатель", "Куратор" })
        //    .HasPostgresEnum("work_format_enum", new[] { "Офис", "Гибрид", "Удаленно" });

        modelBuilder.Entity<ApplicantAchievement>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("applicant_achievements_pkey");

            entity.ToTable("applicant_achievements");

            entity.HasIndex(e => e.ApplicantId, "idx_applicant_achievements_applicant_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ApplicantId).HasColumnName("applicant_id");
            entity.Property(e => e.Attachments)
                .HasColumnType("character varying(500)[]")
                .HasColumnName("attachments");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Location)
                .HasMaxLength(255)
                .HasColumnName("location");
            entity.Property(e => e.ObtainDate).HasColumnName("obtain_date");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");



            entity.HasOne(d => d.Applicant).WithMany(p => p.ApplicantAchievements)
                .HasForeignKey(d => d.ApplicantId)
                .HasConstraintName("applicant_achievements_applicant_id_fkey");
        });

        modelBuilder.Entity<ApplicantEducation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("applicant_educations_pkey");

            entity.ToTable("applicant_educations");

            entity.HasIndex(e => e.ApplicantId, "idx_applicant_educations_applicant_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ApplicantId)
                .HasColumnName("applicant_id");
            entity.Property(e => e.Attachments)
                .HasColumnType("character varying(500)[]")
                .HasColumnName("attachments");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Faculty)
                .HasMaxLength(255)
                .HasColumnName("faculty");
            entity.Property(e => e.GraduationYear).HasColumnName("graduation_year");
            entity.Property(e => e.InstitutionName)
                .HasMaxLength(255)
                .HasColumnName("institution_name");
            entity.Property(e => e.IsCompleted)
                .HasDefaultValue(false)
                .HasColumnName("is_completed");
            entity.Property(e => e.Specialization)
                .HasMaxLength(255)
                .HasColumnName("specialization");
            entity.Property(e => e.StartYear).HasColumnName("start_year");
            entity.Property(e => e.EducationLevel)
                .HasMaxLength(100)
                .HasColumnName("education_level");

            entity.HasOne(d => d.Applicant).WithMany(p => p.ApplicantEducations)
                .HasForeignKey(d => d.ApplicantId)
                .HasConstraintName("applicant_educations_applicant_id_fkey");
        });

        modelBuilder.Entity<ApplicantProfile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("applicant_profiles_pkey");

            entity.ToTable("applicant_profiles");

            entity.HasIndex(e => e.UserId, "applicant_profiles_user_id_key").IsUnique();

            entity.HasIndex(e => e.UserId, "idx_applicant_profiles_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Links)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("links");
            entity.Property(e => e.ModerationStatus)
                .HasMaxLength(50)
                .HasDefaultValue(CandidateModerationStatuses.Pending)
                .HasColumnName("moderation_status");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.PrivacySettings)
                .HasDefaultValueSql("'{\"hide_resume\": false, \"hide_responses\": false}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("privacy_settings");
            entity.Property(e => e.Skills)
                .HasColumnType("character varying(100)[]")
                .HasColumnName("skills");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithOne(p => p.ApplicantProfile)
                .HasForeignKey<ApplicantProfile>(d => d.UserId)
            .HasConstraintName("applicant_profiles_user_id_fkey");
        });

        modelBuilder.Entity<CandidateProject>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("candidate_projects_pkey");

            entity.ToTable("candidate_projects");

            entity.HasIndex(e => e.ApplicantId, "idx_candidate_projects_applicant_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ApplicantId).HasColumnName("applicant_id");
            entity.Property(e => e.CaseStudyUrl)
                .HasMaxLength(1000)
                .HasColumnName("case_study_url");
            entity.Property(e => e.Contribution).HasColumnName("contribution");
            entity.Property(e => e.CoverImageUrl)
                .HasColumnType("text")
                .HasColumnName("cover_image_url");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DemoUrl)
                .HasMaxLength(1000)
                .HasColumnName("demo_url");
            entity.Property(e => e.DesignUrl)
                .HasMaxLength(1000)
                .HasColumnName("design_url");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.IsOngoing)
                .HasDefaultValue(false)
                .HasColumnName("is_ongoing");
            entity.Property(e => e.LessonsLearned).HasColumnName("lessons_learned");
            entity.Property(e => e.Metrics).HasColumnName("metrics");
            entity.Property(e => e.Organization)
                .HasMaxLength(255)
                .HasColumnName("organization");
            entity.Property(e => e.Problem).HasColumnName("problem");
            entity.Property(e => e.ProjectType)
                .HasMaxLength(100)
                .HasColumnName("project_type");
            entity.Property(e => e.ParticipantsJson)
                .HasDefaultValueSql("'[]'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("participants");
            entity.Property(e => e.RepositoryUrl)
                .HasMaxLength(1000)
                .HasColumnName("repository_url");
            entity.Property(e => e.Result).HasColumnName("result");
            entity.Property(e => e.Role)
                .HasMaxLength(255)
                .HasColumnName("role");
            entity.Property(e => e.ShortDescription).HasColumnName("short_description");
            entity.Property(e => e.ShowInPortfolio)
                .HasDefaultValue(true)
                .HasColumnName("show_in_portfolio");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Tags)
                .HasColumnType("character varying(100)[]")
                .HasColumnName("tags");
            entity.Property(e => e.TeamSize).HasColumnName("team_size");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Applicant).WithMany(p => p.CandidateProjects)
                .HasForeignKey(d => d.ApplicantId)
                .HasConstraintName("candidate_projects_applicant_id_fkey");
        });

        modelBuilder.Entity<ChatThread>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("chat_threads_pkey");

            entity.ToTable("chat_threads");

            entity.HasIndex(e => e.CreatedByUserId, "idx_chat_threads_created_by_user_id");
            entity.HasIndex(e => e.LastMessageAt, "idx_chat_threads_last_message_at");
            entity.HasIndex(e => new { e.ContextType, e.ContextId }, "idx_chat_threads_context");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Subject)
                .HasMaxLength(160)
                .HasColumnName("subject");
            entity.Property(e => e.ContextType)
                .HasMaxLength(80)
                .HasDefaultValue(ChatContextTypes.Direct)
                .HasColumnName("context_type");
            entity.Property(e => e.ContextId).HasColumnName("context_id");
            entity.Property(e => e.CreatedByUserId).HasColumnName("created_by_user_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.LastMessageAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("last_message_at");

            entity.HasOne(d => d.CreatedByUser)
                .WithMany()
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("chat_threads_created_by_user_id_fkey");
        });

        modelBuilder.Entity<ChatParticipant>(entity =>
        {
            entity.HasKey(e => new { e.ThreadId, e.UserId }).HasName("chat_participants_pkey");

            entity.ToTable("chat_participants");

            entity.HasIndex(e => e.UserId, "idx_chat_participants_user_id");
            entity.HasIndex(e => new { e.UserId, e.LastReadAt }, "idx_chat_participants_user_last_read_at");

            entity.Property(e => e.ThreadId).HasColumnName("thread_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Role)
                .HasMaxLength(40)
                .HasColumnName("role");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.LastReadAt).HasColumnName("last_read_at");
            entity.Property(e => e.IsMuted)
                .HasDefaultValue(false)
                .HasColumnName("is_muted");

            entity.HasOne(d => d.Thread)
                .WithMany(p => p.Participants)
                .HasForeignKey(d => d.ThreadId)
                .HasConstraintName("chat_participants_thread_id_fkey");

            entity.HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("chat_participants_user_id_fkey");
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("chat_messages_pkey");

            entity.ToTable("chat_messages");

            entity.HasIndex(e => new { e.ThreadId, e.CreatedAt }, "idx_chat_messages_thread_created_at");
            entity.HasIndex(e => e.SenderUserId, "idx_chat_messages_sender_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ThreadId).HasColumnName("thread_id");
            entity.Property(e => e.SenderUserId).HasColumnName("sender_user_id");
            entity.Property(e => e.Body).HasColumnName("body");
            entity.Property(e => e.IsSystem)
                .HasDefaultValue(false)
                .HasColumnName("is_system");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");

            entity.HasOne(d => d.Thread)
                .WithMany(p => p.Messages)
                .HasForeignKey(d => d.ThreadId)
                .HasConstraintName("chat_messages_thread_id_fkey");

            entity.HasOne(d => d.SenderUser)
                .WithMany()
                .HasForeignKey(d => d.SenderUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("chat_messages_sender_user_id_fkey");
        });

        modelBuilder.Entity<OpportunityApplication>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("applications_pkey");

            entity.ToTable("applications");

            entity.HasIndex(e => new { e.OpportunityId, e.ApplicantId }, "applications_opportunity_id_applicant_id_key").IsUnique();

            entity.HasIndex(e => e.ApplicantId, "idx_applications_applicant_id");

            entity.HasIndex(e => e.OpportunityId, "idx_applications_opportunity_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ApplicantId).HasColumnName("applicant_id");
            entity.Property(e => e.AppliedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("applied_at");
            entity.Property(e => e.AllowPeerVisibility)
                .HasDefaultValue(false)
                .HasColumnName("allow_peer_visibility");
            entity.Property(e => e.EmployerNote).HasColumnName("employer_note");
            entity.Property(e => e.OpportunityId).HasColumnName("opportunity_id");
            entity.Property(e => e.Status)
                .HasDefaultValue(OpportunityApplicationStatuses.Submitted)
                .HasColumnName("status");

            entity.HasOne(d => d.Applicant).WithMany(p => p.Applications)
                .HasForeignKey(d => d.ApplicantId)
                .HasConstraintName("applications_applicant_id_fkey");

            entity.HasOne(d => d.Opportunity).WithMany(p => p.Applications)
                .HasForeignKey(d => d.OpportunityId)
                .HasConstraintName("applications_opportunity_id_fkey");


        });

        modelBuilder.Entity<OpportunityShare>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("opportunity_shares_pkey");

            entity.ToTable("opportunity_shares");

            entity.HasIndex(e => new { e.SenderUserId, e.RecipientUserId, e.OpportunityId }, "opportunity_shares_sender_user_id_recipient_user_id_opportunity_id_key")
                .IsUnique();
            entity.HasIndex(e => e.RecipientUserId, "idx_opportunity_shares_recipient_user_id");
            entity.HasIndex(e => e.SenderUserId, "idx_opportunity_shares_sender_user_id");
            entity.HasIndex(e => e.OpportunityId, "idx_opportunity_shares_opportunity_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SenderUserId).HasColumnName("sender_user_id");
            entity.Property(e => e.RecipientUserId).HasColumnName("recipient_user_id");
            entity.Property(e => e.OpportunityId).HasColumnName("opportunity_id");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");

            entity.HasOne(d => d.SenderUser)
                .WithMany()
                .HasForeignKey(d => d.SenderUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("opportunity_shares_sender_user_id_fkey");

            entity.HasOne(d => d.RecipientUser)
                .WithMany()
                .HasForeignKey(d => d.RecipientUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("opportunity_shares_recipient_user_id_fkey");

            entity.HasOne(d => d.Opportunity)
                .WithMany()
                .HasForeignKey(d => d.OpportunityId)
                .HasConstraintName("opportunity_shares_opportunity_id_fkey");

            entity.HasCheckConstraint("CK_OpportunityShares_SenderNotEqualRecipient", "sender_user_id <> recipient_user_id");
        });

        modelBuilder.Entity<Complaint>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("complaints_pkey");

            entity.ToTable("complaints");

            entity.HasIndex(e => e.OpportunityId, "idx_complaints_opportunity_id");
            entity.HasIndex(e => e.ReporterUserId, "idx_complaints_reporter_user_id");
            entity.HasIndex(e => e.Status, "idx_complaints_status");
            entity.HasIndex(e => e.CreatedAt, "idx_complaints_created_at");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ReporterUserId).HasColumnName("reporter_user_id");
            entity.Property(e => e.OpportunityId).HasColumnName("opportunity_id");
            entity.Property(e => e.Reason)
                .HasMaxLength(120)
                .HasColumnName("reason");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("pending")
                .HasColumnName("status");
            entity.Property(e => e.ModeratorNote).HasColumnName("moderator_note");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
            entity.Property(e => e.ResolvedByUserId).HasColumnName("resolved_by_user_id");

            entity.HasOne(d => d.ReporterUser)
                .WithMany(p => p.Complaints)
                .HasForeignKey(d => d.ReporterUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("complaints_reporter_user_id_fkey");

            entity.HasOne(d => d.Opportunity)
                .WithMany(p => p.Complaints)
                .HasForeignKey(d => d.OpportunityId)
                .HasConstraintName("complaints_opportunity_id_fkey");

            entity.HasOne(d => d.ResolvedByUser)
                .WithMany()
                .HasForeignKey(d => d.ResolvedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("complaints_resolved_by_user_id_fkey");
        });

        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.ContactProfileId }).HasName("contacts_pkey");

            entity.ToTable("contacts");

            entity.HasIndex(e => e.ContactProfileId, "idx_contacts_contact_id");

            entity.HasIndex(e => e.UserId, "idx_contacts_user_id");

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.ContactProfileId).HasColumnName("contact_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");

            entity.HasOne(d => d.User).WithMany(p => p.Contacts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("contacts_user_id_fkey");

            entity.HasCheckConstraint("CK_Contacts_UserNotEqualContact", "user_id <> contact_id");
        });

        modelBuilder.Entity<FriendRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("friend_requests_pkey");

            entity.ToTable("friend_requests");

            entity.HasIndex(e => e.SenderUserId, "idx_friend_requests_sender_user_id");

            entity.HasIndex(e => e.RecipientUserId, "idx_friend_requests_recipient_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SenderUserId).HasColumnName("sender_user_id");
            entity.Property(e => e.RecipientUserId).HasColumnName("recipient_user_id");
            entity.Property(e => e.Status)
                .HasMaxLength(32)
                .HasDefaultValue(FriendRequestStatuses.Pending)
                .HasColumnName("status");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.RespondedAt).HasColumnName("responded_at");

            entity.HasOne(d => d.SenderUser).WithMany(p => p.OutgoingFriendRequests)
                .HasForeignKey(d => d.SenderUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("friend_requests_sender_user_id_fkey");

            entity.HasOne(d => d.RecipientUser).WithMany(p => p.IncomingFriendRequests)
                .HasForeignKey(d => d.RecipientUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("friend_requests_recipient_user_id_fkey");

            entity.HasCheckConstraint("CK_FriendRequests_SenderNotEqualRecipient", "sender_user_id <> recipient_user_id");
        });

        modelBuilder.Entity<CandidateProjectInvite>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("candidate_project_invites_pkey");

            entity.ToTable("candidate_project_invites");

            entity.HasIndex(e => e.SenderUserId, "idx_candidate_project_invites_sender_user_id");

            entity.HasIndex(e => e.RecipientUserId, "idx_candidate_project_invites_recipient_user_id");

            entity.HasIndex(e => e.ProjectId, "idx_candidate_project_invites_project_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SenderUserId).HasColumnName("sender_user_id");
            entity.Property(e => e.RecipientUserId).HasColumnName("recipient_user_id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.Role)
                .HasMaxLength(255)
                .HasColumnName("role");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.Status)
                .HasMaxLength(32)
                .HasDefaultValue(ProjectInviteStatuses.Pending)
                .HasColumnName("status");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.RespondedAt).HasColumnName("responded_at");

            entity.HasOne(d => d.Project).WithMany(p => p.Invites)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("candidate_project_invites_project_id_fkey");

            entity.HasOne(d => d.SenderUser).WithMany(p => p.OutgoingProjectInvites)
                .HasForeignKey(d => d.SenderUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("candidate_project_invites_sender_user_id_fkey");

            entity.HasOne(d => d.RecipientUser).WithMany(p => p.IncomingProjectInvites)
                .HasForeignKey(d => d.RecipientUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("candidate_project_invites_recipient_user_id_fkey");

            entity.HasCheckConstraint("CK_CandidateProjectInvites_SenderNotEqualRecipient", "sender_user_id <> recipient_user_id");
        });

        modelBuilder.Entity<CuratorProfile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("curator_profiles_pkey");

            entity.ToTable("curator_profiles");

            entity.HasIndex(e => e.UserId, "curator_profiles_user_id_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IsAdministrator)
                .HasDefaultValue(false)
                .HasColumnName("is_administrator");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.Surname)
                .HasMaxLength(100)
                .HasColumnName("surname");
            entity.Property(e => e.Thirdname)
                .HasMaxLength(100)
                .HasColumnName("thirdname");
            entity.Property(e => e.UserId).HasColumnName("user_id");

        });

        modelBuilder.Entity<EmployerProfile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("employer_profiles_pkey");

            entity.ToTable("employer_profiles");

            entity.HasIndex(e => e.UserId, "employer_profiles_user_id_key").IsUnique();

            entity.HasIndex(e => e.UserId, "idx_employer_profiles_user_id");
            entity.Property(e => e.VerificationStatus)
                .HasColumnName("verification_status")
                .HasDefaultValue(CompanyVerificationStatuses.Pending);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CompanyName)
                .HasMaxLength(255)
                .HasColumnName("company_name");
            entity.Property(e => e.CaseStudiesJson)
                .HasColumnType("jsonb")
                .HasColumnName("case_studies");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.GalleryJson)
                .HasColumnType("jsonb")
                .HasColumnName("gallery");
            entity.Property(e => e.HeroMediaJson)
                .HasColumnType("jsonb")
                .HasColumnName("hero_media");
            entity.Property(e => e.Inn)
                .HasMaxLength(20)
                .HasColumnName("inn");
            entity.Property(e => e.LegalAddress)
                .HasMaxLength(500)
                .HasColumnName("legal_address");
            entity.Property(e => e.MediaContent)
                .HasDefaultValueSql("'[]'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("media_content");
            entity.Property(e => e.ProfileImage)
                .HasMaxLength(500)
                .HasColumnName("profile_image");
            entity.Property(e => e.Socials)
                .HasDefaultValueSql("'[]'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("socials");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.VerificationData).HasColumnName("verification_data");
            entity.Property(e => e.VerificationMethod)
                .HasMaxLength(50)
                .HasColumnName("verification_method");
            entity.Property(e => e.VerificationReason)
                .HasColumnType("text")
                .HasColumnName("verification_reason");
        });

        modelBuilder.Entity<CompanySetting>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("company_settings_pkey");

            entity.ToTable("company_settings");

            entity.HasIndex(e => e.EmployerId, "company_settings_employer_id_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.EmployerId).HasColumnName("employer_id");
            entity.Property(e => e.NotificationEmail)
                .HasMaxLength(255)
                .HasColumnName("notification_email");
            entity.Property(e => e.NotifyNewApplications)
                .HasDefaultValue(true)
                .HasColumnName("notify_new_applications");
            entity.Property(e => e.NotifyModerationUpdates)
                .HasDefaultValue(true)
                .HasColumnName("notify_moderation_updates");
            entity.Property(e => e.NotifyComplaintsAndSystem)
                .HasDefaultValue(true)
                .HasColumnName("notify_complaints_and_system");
            entity.Property(e => e.DefaultStartSection)
                .HasMaxLength(40)
                .HasDefaultValue("profile")
                .HasColumnName("default_start_section");
            entity.Property(e => e.DefaultResponsesSort)
                .HasMaxLength(40)
                .HasDefaultValue("newest")
                .HasColumnName("default_responses_sort");
            entity.Property(e => e.ShowArchivedOpportunities)
                .HasDefaultValue(false)
                .HasColumnName("show_archived_opportunities");
            entity.Property(e => e.AllowCompanyMessages)
                .HasDefaultValue(false)
                .HasColumnName("allow_company_messages");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(d => d.Employer)
                .WithOne(p => p.Settings)
                .HasForeignKey<CompanySetting>(d => d.EmployerId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("company_settings_employer_id_fkey");
        });

        modelBuilder.Entity<ModeratorInvitation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("moderator_invitations_pkey");

            entity.ToTable("moderator_invitations");

            entity.HasIndex(e => e.Email, "idx_moderator_invitations_email");
            entity.HasIndex(e => e.InvitedByUserId, "idx_moderator_invitations_invited_by_user_id");
            entity.HasIndex(e => e.AcceptedUserId, "idx_moderator_invitations_accepted_user_id");
            entity.HasIndex(e => e.TokenHash, "moderator_invitations_token_hash_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AcceptedAt).HasColumnName("accepted_at");
            entity.Property(e => e.AcceptedUserId).HasColumnName("accepted_user_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.InvitedByUserId).HasColumnName("invited_by_user_id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.RevokedAt).HasColumnName("revoked_at");
            entity.Property(e => e.Surname)
                .HasMaxLength(100)
                .HasColumnName("surname");
            entity.Property(e => e.Thirdname)
                .HasMaxLength(100)
                .HasColumnName("thirdname");
            entity.Property(e => e.TokenHash)
                .HasMaxLength(255)
                .HasColumnName("token_hash");

            entity.HasOne(d => d.InvitedByUser)
                .WithMany()
                .HasForeignKey(d => d.InvitedByUserId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("moderator_invitations_invited_by_user_id_fkey");

            entity.HasOne(d => d.AcceptedUser)
                .WithMany()
                .HasForeignKey(d => d.AcceptedUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("moderator_invitations_accepted_user_id_fkey");
        });

        modelBuilder.Entity<Opportunity>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("opportunities_pkey");

            entity.ToTable("opportunities");

            entity.HasIndex(e => e.EmployerId, "idx_opportunities_employer_id");

            entity.HasIndex(e => e.LocationCity, "idx_opportunities_location_city");

            entity.HasIndex(e => e.PublishAt, "idx_opportunities_publish_at");

            if (isNpgsqlProvider)
            {
                entity.HasIndex(e => e.SearchVector, "idx_opportunities_search_vector").HasMethod("gin");
            }

            entity.Property(e => e.OpportunityType)
                //.HasColumnType("opportunity_type_enum")
                .HasColumnName("opportunity_type");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            entity.Property(e => e.ContactsJson)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("contacts");
            entity.Property(e => e.Duration)
                .HasColumnName("duration");
            entity.Property(e => e.Description)
                .HasColumnName("description");
            entity.Property(e => e.EmployerId)
                .HasColumnName("employer_id");
            entity.Property(e => e.ExpireAt)
                .HasColumnName("expire_at");
            entity.Property(e => e.EventStartAt)
                .HasColumnName("event_start_at");
            entity.Property(e => e.EmploymentType)
                .HasColumnName("employment_type");
            entity.Property(e => e.ExperienceLevel)
                .HasMaxLength(80)
                .HasColumnName("experience_level");
            entity.Property(e => e.Schedule)
                .HasMaxLength(80)
                .HasColumnName("schedule");
            entity.Property(e => e.IsPaid)
                .HasColumnName("is_paid");
            entity.Property(e => e.MeetingFrequency)
                .HasColumnName("meeting_frequency");
            entity.Property(e => e.Latitude)
                .HasPrecision(9, 6)
                .HasColumnName("latitude");
            entity.Property(e => e.LocationAddress)
                .HasMaxLength(500)
                .HasColumnName("location_address");
            entity.Property(e => e.LocationCity)
                .HasMaxLength(100)
                .HasColumnName("location_city");
            entity.Property(e => e.Longitude)
                .HasPrecision(9, 6)
                .HasColumnName("longitude");
            entity.Property(e => e.ModerationReason)
                .HasColumnName("moderation_reason");
            entity.Property(e => e.ModerationStatus)
                .HasMaxLength(50)
                .HasColumnName("moderation_status")
                .HasDefaultValue(OpportunityModerationStatuses.Draft);
            entity.Property(e => e.MediaContentJson)
                .HasDefaultValueSql("'[]'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("media_content");
            entity.Property(e => e.RegistrationDeadline)
                .HasColumnName("registration_deadline");
            entity.Property(e => e.SalaryFrom)
                .HasPrecision(12, 2)
                .HasColumnName("salary_from");
            entity.Property(e => e.SalaryTo)
                .HasPrecision(12, 2)
                .HasColumnName("salary_to");
            entity.Property(e => e.SeatsCount)
                .HasColumnName("seats_count");
            entity.Property(e => e.StipendFrom)
                .HasPrecision(12, 2)
                .HasColumnName("stipend_from");
            entity.Property(e => e.StipendTo)
                .HasPrecision(12, 2)
                .HasColumnName("stipend_to");
            entity.Property(e => e.PublishAt)
                .HasDefaultValueSql("CURRENT_DATE")
                .HasColumnName("publish_at");
            if (isNpgsqlProvider)
            {
                entity.Property(e => e.SearchVector).HasColumnName("search_vector");
            }
            else
            {
                entity.Ignore(e => e.SearchVector);
            }
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");

            entity.HasOne(d => d.Employer).WithMany(p => p.Opportunities)
                .HasForeignKey(d => d.EmployerId)
                .HasConstraintName("opportunities_employer_id_fkey");

            entity.HasMany(d => d.Tags).WithMany(p => p.Opportunities)
                .UsingEntity<Dictionary<string, object>>(
                    "OpportunityTag",
                    r => r.HasOne<Tag>().WithMany()
                        .HasForeignKey("TagId")
                        .HasConstraintName("opportunity_tags_tag_id_fkey"),
                    l => l.HasOne<Opportunity>().WithMany()
                        .HasForeignKey("OpportunityId")
                        .HasConstraintName("opportunity_tags_opportunity_id_fkey"),
                    j =>
                    {
                        j.HasKey("OpportunityId", "TagId").HasName("opportunity_tags_pkey");
                        j.ToTable("opportunity_tags");
                        j.HasIndex(new[] { "OpportunityId" }, "idx_opportunity_tags_opportunity_id");
                        j.HasIndex(new[] { "TagId" }, "idx_opportunity_tags_tag_id");
                        j.IndexerProperty<int>("OpportunityId").HasColumnName("opportunity_id");
                        j.IndexerProperty<int>("TagId").HasColumnName("tag_id");
                    });
        });

        modelBuilder.Entity<Recommendation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("recommendations_pkey");

            entity.ToTable("recommendations");

            entity.HasIndex(e => new { e.RecommenderId, e.CandidateId }, "recommendations_recommender_id_candidate_id_key").IsUnique();
            entity.HasIndex(e => e.OpportunityId, "idx_recommendations_opportunity_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CandidateId).HasColumnName("candidate_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.OpportunityId).HasColumnName("opportunity_id");
            entity.Property(e => e.RecommenderId).HasColumnName("recommender_id");

            entity.HasOne(d => d.Candidate).WithMany(p => p.RecommendationCandidates)
                .HasForeignKey(d => d.CandidateId)
                .HasConstraintName("recommendations_candidate_id_fkey");

            entity.HasOne(d => d.Opportunity).WithMany(p => p.Recommendations)
                .HasForeignKey(d => d.OpportunityId)
                .HasConstraintName("recommendations_opportunity_id_fkey");

            entity.HasOne(d => d.Recommender).WithMany(p => p.RecommendationRecommenders)
                .HasForeignKey(d => d.RecommenderId)
                .HasConstraintName("recommendations_recommender_id_fkey");
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("tags_pkey");

            entity.ToTable("tags");

            entity.HasIndex(e => e.Name, "tags_name_key").IsUnique();
            entity.HasIndex(e => e.MergedIntoTagId, "idx_tags_merged_into_tag_id");
            entity.HasIndex(e => e.UpdatedByUserId, "idx_tags_updated_by_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.MergedIntoTagId).HasColumnName("merged_into_tag_id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.UpdatedByUserId).HasColumnName("updated_by_user_id");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Tags)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("tags_created_by_fkey");

            entity.HasOne(d => d.UpdatedByUser).WithMany()
                .HasForeignKey(d => d.UpdatedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("tags_updated_by_user_id_fkey");

            entity.HasOne(d => d.MergedIntoTag).WithMany(p => p.MergedTags)
                .HasForeignKey(d => d.MergedIntoTagId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("tags_merged_into_tag_id_fkey");
        });

        modelBuilder.Entity<SystemReferenceItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("system_reference_items_pkey");

            entity.ToTable("system_reference_items");

            entity.HasIndex(e => new { e.Category, e.Key }, "system_reference_items_category_key_key").IsUnique();
            entity.HasIndex(e => new { e.Category, e.IsActive, e.SortOrder }, "idx_system_reference_items_category_active_sort");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Category)
                .HasMaxLength(80)
                .HasColumnName("category");
            entity.Property(e => e.Key)
                .HasMaxLength(120)
                .HasColumnName("key");
            entity.Property(e => e.Label)
                .HasMaxLength(255)
                .HasColumnName("label");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsSystem)
                .HasDefaultValue(false)
                .HasColumnName("is_system");
            entity.Property(e => e.SortOrder)
                .HasDefaultValue(0)
                .HasColumnName("sort_order");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.UpdatedByUserId).HasColumnName("updated_by_user_id");

            entity.HasOne(d => d.UpdatedByUser).WithMany()
                .HasForeignKey(d => d.UpdatedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("system_reference_items_updated_by_user_id_fkey");
        });

        modelBuilder.Entity<ModeratorSetting>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("moderator_settings_pkey");

            entity.ToTable("moderator_settings");

            entity.HasIndex(e => e.UserId, "moderator_settings_user_id_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.NotificationSettingsJson)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("notification_settings");
            entity.Property(e => e.QueueSettingsJson)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("queue_settings");
            entity.Property(e => e.StartPage)
                .HasMaxLength(120)
                .HasColumnName("start_page");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.User).WithOne()
                .HasForeignKey<ModeratorSetting>(d => d.UserId)
                .HasConstraintName("moderator_settings_user_id_fkey");
        });

        modelBuilder.Entity<ModerationAuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("moderation_audit_logs_pkey");

            entity.ToTable("moderation_audit_logs");

            entity.HasIndex(e => e.ActorUserId, "idx_moderation_audit_logs_actor_user_id");
            entity.HasIndex(e => new { e.EntityType, e.EntityId }, "idx_moderation_audit_logs_entity");
            entity.HasIndex(e => e.CreatedAt, "idx_moderation_audit_logs_created_at");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActorUserId).HasColumnName("actor_user_id");
            entity.Property(e => e.Action)
                .HasMaxLength(120)
                .HasColumnName("action");
            entity.Property(e => e.EntityType)
                .HasMaxLength(80)
                .HasColumnName("entity_type");
            entity.Property(e => e.EntityId).HasColumnName("entity_id");
            entity.Property(e => e.Summary)
                .HasMaxLength(1000)
                .HasColumnName("summary");
            entity.Property(e => e.MetadataJson)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("metadata");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");

            entity.HasOne(d => d.ActorUser).WithMany()
                .HasForeignKey(d => d.ActorUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("moderation_audit_logs_actor_user_id_fkey");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");

            entity.ToTable("users");

            entity.HasIndex(e => e.DeletedAt, "idx_users_deleted_at").HasFilter("(deleted_at IS NOT NULL)");

            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");

            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.EmailVerificationAttemptCount)
                .HasDefaultValue(0)
                .HasColumnName("email_verification_attempt_count");
            entity.Property(e => e.EmailVerificationCodeHash)
                .HasMaxLength(255)
                .HasColumnName("email_verification_code_hash");
            entity.Property(e => e.EmailVerificationExpiresAt).HasColumnName("email_verification_expires_at");
            entity.Property(e => e.EmailVerificationSentAt).HasColumnName("email_verification_sent_at");
            entity.Property(e => e.IsVerified)
                .HasDefaultValue(false)
                .HasColumnName("is_verified");
            entity.Property(e => e.PreVerify)
                .HasDefaultValue(true)
                .HasColumnName("pre_verify");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.PasswordResetAttemptCount)
                .HasDefaultValue(0)
                .HasColumnName("password_reset_attempt_count");
            entity.Property(e => e.PasswordResetCodeHash)
                .HasMaxLength(255)
                .HasColumnName("password_reset_code_hash");
            entity.Property(e => e.PasswordResetExpiresAt).HasColumnName("password_reset_expires_at");
            entity.Property(e => e.PasswordResetSentAt).HasColumnName("password_reset_sent_at");
        });

        modelBuilder.Entity<UserNotification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("user_notifications_pkey");

            entity.ToTable("user_notifications");

            entity.HasIndex(e => e.UserId, "idx_user_notifications_user_id");
            entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt }, "idx_user_notifications_user_unread_created_at");
            entity.HasIndex(e => e.CreatedAt, "idx_user_notifications_created_at");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Type)
                .HasMaxLength(80)
                .HasColumnName("type");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.Link)
                .HasMaxLength(1000)
                .HasColumnName("link");
            entity.Property(e => e.IsRead)
                .HasDefaultValue(false)
                .HasColumnName("is_read");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.ReadAt).HasColumnName("read_at");
            entity.Property(e => e.ActorUserId).HasColumnName("actor_user_id");
            entity.Property(e => e.OpportunityId).HasColumnName("opportunity_id");
            entity.Property(e => e.ApplicationId).HasColumnName("application_id");
            entity.Property(e => e.ComplaintId).HasColumnName("complaint_id");
            entity.Property(e => e.MetadataJson)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("metadata");

            entity.HasOne(d => d.User)
                .WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("user_notifications_user_id_fkey");

            entity.HasOne(d => d.ActorUser)
                .WithMany()
                .HasForeignKey(d => d.ActorUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("user_notifications_actor_user_id_fkey");

            entity.HasOne(d => d.Opportunity)
                .WithMany()
                .HasForeignKey(d => d.OpportunityId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("user_notifications_opportunity_id_fkey");

            entity.HasOne(d => d.Application)
                .WithMany(p => p.Notifications)
                .HasForeignKey(d => d.ApplicationId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("user_notifications_application_id_fkey");

            entity.HasOne(d => d.Complaint)
                .WithMany(p => p.Notifications)
                .HasForeignKey(d => d.ComplaintId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("user_notifications_complaint_id_fkey");
        });

        modelBuilder.Entity<VApplicantStat>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_applicant_stats");

            entity.Property(e => e.AchievementsCount).HasColumnName("achievements_count");
            entity.Property(e => e.ContactCount).HasColumnName("contact_count");
            entity.Property(e => e.EducationsCount).HasColumnName("educations_count");
            entity.Property(e => e.ProfileId).HasColumnName("profile_id");
            entity.Property(e => e.ProjectsCount).HasColumnName("projects_count");
            entity.Property(e => e.ResponsesCount).HasColumnName("responses_count");
        });

        modelBuilder.Entity<VEmployerStat>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_employer_stats");

            entity.Property(e => e.CurrentOpportunitiesCount).HasColumnName("current_opportunities_count");
            entity.Property(e => e.ProfileId).HasColumnName("profile_id");
        });

        modelBuilder.Entity<AiCareerCache>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ai_career_cache_pkey");

            entity.ToTable("ai_career_cache");

            entity.HasIndex(e => new { e.ApplicantId, e.Scope }, "ai_career_cache_applicant_id_scope_key").IsUnique();
            entity.HasIndex(e => e.ExpiresAt, "idx_ai_career_cache_expires_at");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ApplicantId).HasColumnName("applicant_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.ExpiresAt)
                .HasColumnType("timestamp with time zone")
                .HasColumnName("expires_at");
            entity.Property(e => e.LastServedAt)
                .HasColumnType("timestamp with time zone")
                .HasColumnName("last_served_at");
            entity.Property(e => e.PayloadJson)
                .HasColumnType("jsonb")
                .HasColumnName("payload")
                .HasDefaultValueSql("'{}'::jsonb");
            entity.Property(e => e.Scope)
                .HasMaxLength(80)
                .HasColumnName("scope");
            entity.Property(e => e.Signature)
                .HasMaxLength(64)
                .HasColumnName("signature");

            entity.HasOne(d => d.Applicant)
                .WithMany()
                .HasForeignKey(d => d.ApplicantId)
                .HasConstraintName("ai_career_cache_applicant_id_fkey")
                .OnDelete(DeleteBehavior.Cascade);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
