using Models;
using NpgsqlTypes;

namespace DTO
{
    public partial class OpportunityPostDTO
    {

        public string Title { get; set; } = null!;

        public string? Description { get; set; } = null!;

        public string? LocationAddress { get; set; }

        public string? LocationCity { get; set; }

        public long? ExpireAt { get; set; }
        public string OpportunityType { get; set; } = string.Empty;
        
        public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
    }

    public partial class OpportunityGetDTO
    {

        public int Id { get; set; }

        public int EmployerId { get; set; }

        public string Title { get; set; } = null!;

        public string Description { get; set; } = null!;

        public string? LocationAddress { get; set; }

        public string? LocationCity { get; set; }

        public decimal? Latitude { get; set; }

        public decimal? Longitude { get; set; }

        public DateOnly PublishAt { get; set; }

        public DateOnly? ExpireAt { get; set; }

        public string? ContactsJson { get; set; }

        public string? MediaContentJson { get; set; }

        public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();

    }

    public partial class OpportunityUpdateDTO
    {

        public int Id { get; set; }

        public string? Title { get; set; } = null!;

        public string? Description { get; set; } = null!;

        public string? OpportunityType { get; set; }

        public string? LocationAddress { get; set; }

        public string? LocationCity { get; set; }

        public long? ExpireAt { get; set; }

        public string? ContactsJson { get; set; }

        public string? MediaContentJson { get; set; }

        public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();

    }

    public partial class OpportunityDeleteDTO
    {
        public int Id { get; set; }
    }


}
