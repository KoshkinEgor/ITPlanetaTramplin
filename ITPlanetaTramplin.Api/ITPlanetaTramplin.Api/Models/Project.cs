namespace Models;

   public class Project
   {
       public int Id { get; set; }
       public int AuthorId{get;set;}
       public string Title { get; set; }
       public string Description { get; set; }
       public string ProjectType { get; set; }
       public DateOnly StartDate { get; set; }
       public DateOnly EndDate { get; set; }
       public string ProjectDetailsJson{get;set;}

       public ApplicantProfile Author{get;set;}
   }