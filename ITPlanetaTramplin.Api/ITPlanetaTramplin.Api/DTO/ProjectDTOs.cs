

namespace DTO;

public class ProjectCreateDTO
{
       public string Title { get; set; }
       public string Description { get; set; }
       public string ProjectType { get; set; }
       public long StartDate { get; set; }
       public long EndDate { get; set; }
       public string ProjectDetailsJson{get;set;}

}