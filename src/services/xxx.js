import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { writeFile, utils } from 'xlsx';
// Lấy __dirname trong ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const lessonsDir = path.join(__dirname, "../../uploads");  // Điều chỉnh đường dẫn về đúng vị trí thư mục uploads

    const questionsData = [
    {
      sentence: "The train will arrive at the station by 3 PM, and passengers should prepare their tickets.",
      blanks: [
        { position: 1, answer: "train" },
        { position: 10, answer: "prepare" }
      ]
    },
    {
      sentence: "Please submit the documents before the deadline tomorrow morning.",
      blanks: [
        { position: 1, answer: "submit" },
        { position: 7, answer: "deadline" }
      ]
    },
    {
      sentence: "She enjoys reading books in the library during the quiet afternoons.",
      blanks: [
        { position: 2, answer: "reading" },
        { position: 5, answer: "library" }
      ]
    },
    {
      sentence: "The company will announce the results of the project next Monday.",
      blanks: [
        { position: 4, answer: "results" },
        { position: 7, answer: "project" }
      ]
    },
    {
      sentence: "Students must complete their assignments and submit them on time.",
      blanks: [
        { position: 3, answer: "assignments" },
        { position: 6, answer: "submit" }
      ]
    },
    {
      sentence: "He bought a new laptop to improve his productivity and work efficiency.",
      blanks: [
        { position: 3, answer: "laptop" },
        { position: 9, answer: "productivity" }
      ]
    },
    {
      sentence: "Traveling abroad requires a valid passport and proper visa documentation.",
      blanks: [
        { position: 2, answer: "passport" },
        { position: 6, answer: "visa" }
      ]
    },
    {
      sentence: "The chef prepared a delicious meal for all the guests at the restaurant.",
      blanks: [
        { position: 2, answer: "prepared" },
        { position: 7, answer: "guests" }
      ]
    },
    {
      sentence: "The manager will review the sales report before the meeting.",
      blanks: [
        { position: 3, answer: "review" },
        { position: 5, answer: "report" }
      ]
    },
    {
      sentence: "Our company plans to expand into international markets next year.",
      blanks: [
        { position: 4, answer: "expand" },
        { position: 6, answer: "markets" }
      ]
    },
    {
      sentence: "She always arrives early to prepare for her classes.",
      blanks: [
        { position: 2, answer: "arrives" },
        { position: 6, answer: "prepare" }
      ]
    },
    {
      sentence: "The technician fixed the computer before the client arrived.",
      blanks: [
        { position: 2, answer: "fixed" },
        { position: 7, answer: "arrived" }
      ]
    },
    {
      sentence: "Employees are required to wear their ID badges at all times.",
      blanks: [
        { position: 5, answer: "wear" },
        { position: 7, answer: "badges" }
      ]
    },
    {
      sentence: "We need to schedule a meeting to discuss the project timeline.",
      blanks: [
        { position: 3, answer: "schedule" },
        { position: 8, answer: "timeline" }
      ]
    },
    {
      sentence: "The teacher asked the students to complete their homework before Friday.",
      blanks: [
        { position: 4, answer: "complete" },
        { position: 7, answer: "homework" }
      ]
    },
    {
      sentence: "The new policy will affect all employees starting next month.",
      blanks: [
        { position: 3, answer: "affect" },
        { position: 6, answer: "employees" }
      ]
    },
    {
      sentence: "He organized a team-building event to boost morale.",
      blanks: [
        { position: 2, answer: "organized" },
        { position: 7, answer: "morale" }
      ]
    },
    {
      sentence: "Please ensure that all the files are backed up before leaving.",
      blanks: [
        { position: 4, answer: "files" },
        { position: 7, answer: "backed" }
      ]
    },
    {
      sentence: "The customer service representative answered all questions politely.",
      blanks: [
        { position: 4, answer: "answered" },
        { position: 6, answer: "questions" }
      ]
    },
    {
      sentence: "We should analyze the data carefully to make accurate predictions.",
      blanks: [
        { position: 2, answer: "analyze" },
        { position: 8, answer: "predictions" }
      ]
    },
    {
      sentence: "The software update improved the system's security and stability.",
      blanks: [
        { position: 3, answer: "improved" },
        { position: 7, answer: "security" }
      ]
    },
    {
      sentence: "He was promoted to senior manager due to his excellent performance.",
      blanks: [
        { position: 4, answer: "promoted" },
        { position: 8, answer: "performance" }
      ]
    },
    {
      sentence: "The marketing team launched a new campaign last week.",
      blanks: [
        { position: 3, answer: "launched" },
        { position: 6, answer: "campaign" }
      ]
    },
    {
      sentence: "Please submit your application before the deadline ends.",
      blanks: [
        { position: 2, answer: "submit" },
        { position: 6, answer: "deadline" }
      ]
    },
    {
      sentence: "The flight was delayed due to bad weather conditions.",
      blanks: [
        { position: 3, answer: "delayed" },
        { position: 7, answer: "weather" }
      ]
    },
    {
      sentence: "She decided to attend the conference in New York next month.",
      blanks: [
        { position: 3, answer: "attend" },
        { position: 7, answer: "conference" }
      ]
    },
    {
      sentence: "The IT department installed new software on all company computers.",
      blanks: [
        { position: 3, answer: "installed" },
        { position: 9, answer: "computers" }
      ]
    },
    {
      sentence: "Employees must follow the safety regulations at the workplace.",
      blanks: [
        { position: 3, answer: "follow" },
        { position: 7, answer: "regulations" }
      ]
    },
    {
      sentence: "The manager held a meeting to discuss the quarterly budget.",
      blanks: [
        { position: 3, answer: "held" },
        { position: 8, answer: "budget" }
      ]
    },
    {
      sentence: "Students should review their notes before taking the final exam.",
      blanks: [
        { position: 2, answer: "review" },
        { position: 8, answer: "exam" }
      ]
    },
    {
      sentence: "The accountant prepared the financial report for the board meeting.",
      blanks: [
        { position: 2, answer: "prepared" },
        { position: 6, answer: "report" }
      ]
    },
    {
      sentence: "Our team plans to expand our business into new regions.",
      blanks: [
        { position: 4, answer: "expand" },
        { position: 8, answer: "regions" }
      ]
    },
    {
      sentence: "Please confirm your attendance by replying to this email.",
      blanks: [
        { position: 1, answer: "confirm" },
        { position: 6, answer: "replying" }
      ]
    },
    {
      sentence: "The manager emphasized the importance of punctuality for all staff.",
      blanks: [
        { position: 3, answer: "emphasized" },
        { position: 7, answer: "punctuality" }
      ]
    },
    {
      sentence: "He purchased new office supplies for the upcoming project.",
      blanks: [
        { position: 2, answer: "purchased" },
        { position: 6, answer: "project" }
      ]
    },
    {
      sentence: "The receptionist greeted visitors and provided necessary information.",
      blanks: [
        { position: 2, answer: "greeted" },
        { position: 6, answer: "information" }
      ]
    },
    {
      sentence: "Employees are encouraged to attend workshops for professional growth.",
      blanks: [
        { position: 3, answer: "attend" },
        { position: 8, answer: "growth" }
      ]
    },
    {
      sentence: "The IT team resolved the network issues within a few hours.",
      blanks: [
        { position: 3, answer: "resolved" },
        { position: 5, answer: "network" }
      ]
    },
    {
      sentence: "She prepared a detailed presentation for the annual conference.",
      blanks: [
        { position: 2, answer: "prepared" },
        { position: 8, answer: "conference" }
      ]
    },
    {
      sentence: "The project manager monitored the progress of all ongoing tasks.",
      blanks: [
        { position: 3, answer: "monitored" },
        { position: 8, answer: "tasks" }
      ]
    },
    {
      sentence: "Please make sure to submit all forms before the office closes.",
      blanks: [
        { position: 6, answer: "submit" },
        { position: 9, answer: "closes" }
      ]
    },
    {
      sentence: "He attended the training session to improve his technical skills.",
      blanks: [
        { position: 2, answer: "attended" },
        { position: 9, answer: "skills" }
      ]
    },
  {
    sentence: "The company is planning to introduce a new product line during the upcoming trade exhibition.",
    blanks: [
      { position: 4, answer: "planning" },
      { position: 7, answer: "introduce" },
      { position: 10, answer: "product" }
    ]
  },
  {
    sentence: "All employees must complete their mandatory training before the new regulations take effect.",
    blanks: [
      { position: 3, answer: "employees" },
      { position: 5, answer: "complete" },
      { position: 9, answer: "training" },
      { position: 15, answer: "effect" }
    ]
  },
  {
    sentence: "The sales team prepared a detailed proposal to win the contract from the international client.",
    blanks: [
      { position: 3, answer: "team" },
      { position: 5, answer: "prepared" },
      { position: 8, answer: "proposal" }
    ]
  },
  {
    sentence: "Visitors are required to sign the logbook and present valid identification at the front desk.",
    blanks: [
      { position: 4, answer: "required" },
      { position: 6, answer: "sign" },
      { position: 13, answer: "identification" }
    ]
  },
  {
    sentence: "The marketing department launched an online survey to gather customer feedback last month.",
    blanks: [
      { position: 3, answer: "department" },
      { position: 4, answer: "launched" },
      { position: 8, answer: "survey" },
      { position: 11, answer: "customer" }
    ]
  },
  {
    sentence: "The CEO will address the company’s financial performance during the annual meeting.",
    blanks: [
      { position: 4, answer: "address" },
      { position: 7, answer: "financial" },
      { position: 8, answer: "performance" }
    ]
  },
  {
    sentence: "To reduce operational costs, the company decided to outsource some of its services.",
    blanks: [
      { position: 3, answer: "reduce" },
      { position: 5, answer: "operational" },
      { position: 10, answer: "outsource" }
    ]
  },
  {
    sentence: "The project team submitted the revised report after receiving additional information.",
    blanks: [
      { position: 3, answer: "team" },
      { position: 4, answer: "submitted" },
      { position: 7, answer: "report" }
    ]
  },
  {
    sentence: "Due to unexpected maintenance, the building’s main elevator will remain unavailable today.",
    blanks: [
      { position: 4, answer: "unexpected" },
      { position: 5, answer: "maintenance" },
      { position: 10, answer: "elevator" }
    ]
  },
  {
    sentence: "The company encourages employees to participate in workshops that support professional development.",
    blanks: [
      { position: 3, answer: "encourages" },
      { position: 6, answer: "employees" },
      { position: 15, answer: "development" }
    ]
  },
  {
    sentence: "Please review the attached document thoroughly before submitting your final version.",
    blanks: [
      { position: 2, answer: "review" },
      { position: 4, answer: "attached" },
      { position: 9, answer: "submitting" }
    ]
  },
  {
    sentence: "The construction team completed the renovation ahead of schedule despite several delays.",
    blanks: [
      { position: 3, answer: "team" },
      { position: 4, answer: "completed" },
      { position: 7, answer: "renovation" }
    ]
  },
  {
    sentence: "A new policy was implemented to ensure workplace safety and improve overall efficiency.",
    blanks: [
      { position: 5, answer: "implemented" },
      { position: 7, answer: "ensure" },
      { position: 8, answer: "workplace" }
    ]
  },
  {
    sentence: "The finance department will review all expense reports submitted during the last quarter.",
    blanks: [
      { position: 2, answer: "finance" },
      { position: 4, answer: "review" },
      { position: 7, answer: "expense" }
    ]
  },
  {
    sentence: "The airline announced several new routes to attract more international travelers this year.",
    blanks: [
      { position: 3, answer: "announced" },
      { position: 6, answer: "routes" },
      { position: 11, answer: "travelers" }
    ]
  },
  {
    sentence: "The manager approved the budget increase after analyzing the projected revenue.",
    blanks: [
      { position: 2, answer: "manager" },
      { position: 3, answer: "approved" },
      { position: 7, answer: "increase" }
    ]
  },
  {
    sentence: "All applicants must provide accurate contact details and verify their identity upon request.",
    blanks: [
      { position: 3, answer: "applicants" },
      { position: 5, answer: "provide" },
      { position: 6, answer: "accurate" }
    ]
  },
  {
    sentence: "The conference room was reserved for the management team throughout the entire afternoon.",
    blanks: [
      { position: 4, answer: "reserved" },
      { position: 8, answer: "management" },
      { position: 12, answer: "afternoon" }
    ]
  },
  {
    sentence: "To improve customer satisfaction, the company upgraded its online support system.",
    blanks: [
      { position: 2, answer: "improve" },
      { position: 4, answer: "customer" },
      { position: 9, answer: "upgraded" }
    ]
  },
  {
    sentence: "The shipment was delayed due to customs issues and unexpected documentation errors.",
    blanks: [
      { position: 3, answer: "delayed" },
      { position: 6, answer: "customs" },
      { position: 8, answer: "issues" }
    ]
  },
  {
    sentence: "The board members discussed potential strategies to increase revenue for the next fiscal year.",
    blanks: [
      { position: 4, answer: "members" },
      { position: 5, answer: "discussed" },
      { position: 7, answer: "strategies" }
    ]
  },
  {
    sentence: "The café introduced a loyalty program to reward frequent customers with special discounts.",
    blanks: [
      { position: 3, answer: "introduced" },
      { position: 6, answer: "loyalty" },
      { position: 11, answer: "customers" }
    ]
  },
  {
    sentence: "After reviewing several candidates, the hiring manager selected three applicants for interviews.",
    blanks: [
      { position: 2, answer: "reviewing" },
      { position: 5, answer: "candidates" },
      { position: 9, answer: "selected" }
    ]
  },
  {
    sentence: "The research team collected valuable data through online surveys and field observations.",
    blanks: [
      { position: 3, answer: "team" },
      { position: 4, answer: "collected" },
      { position: 6, answer: "valuable" }
    ]
  },
  {
    sentence: "The hotel staff prepared welcome packages for guests attending the business conference.",
    blanks: [
      { position: 3, answer: "staff" },
      { position: 4, answer: "prepared" },
      { position: 6, answer: "welcome" }
    ]
  },

  /* ==========================  
      TỪ CÂU 26 → 100  
    ========================== */

  {
    sentence: "The operations manager introduced a new workflow to enhance productivity across all departments.",
    blanks: [
      { position: 3, answer: "manager" },
      { position: 4, answer: "introduced" },
      { position: 9, answer: "workflow" }
    ]
  },
  {
    sentence: "Employees were reminded to update their passwords regularly to maintain system security.",
    blanks: [
      { position: 2, answer: "reminded" },
      { position: 5, answer: "update" },
      { position: 9, answer: "regularly" },
      { position: 13, answer: "security" }
    ]
  },
  {
    sentence: "The logistics team coordinated the shipment schedule to ensure timely delivery.",
    blanks: [
      { position: 3, answer: "team" },
      { position: 4, answer: "coordinated" },
      { position: 6, answer: "shipment" }
    ]
  },
  {
    sentence: "To meet increasing demand, the company expanded its warehouse facilities last year.",
    blanks: [
      { position: 3, answer: "meet" },
      { position: 4, answer: "increasing" },
      { position: 7, answer: "expanded" }
    ]
  },
  {
    sentence: "The board of directors approved the restructuring plan to improve profitability.",
    blanks: [
      { position: 6, answer: "approved" },
      { position: 9, answer: "restructuring" },
      { position: 11, answer: "plan" }
    ]
  },
  {
    sentence: "Customers can track their orders online using the company’s updated tracking system.",
    blanks: [
      { position: 2, answer: "track" },
      { position: 5, answer: "orders" },
      { position: 11, answer: "tracking" }
    ]
  },
  {
    sentence: "The supervisor assigned new responsibilities to team members based on their skills.",
    blanks: [
      { position: 2, answer: "supervisor" },
      { position: 3, answer: "assigned" },
      { position: 5, answer: "responsibilities" }
    ]
  },
  {
    sentence: "Due to budget constraints, the company postponed the launch of several new services.",
    blanks: [
      { position: 4, answer: "budget" },
      { position: 5, answer: "constraints" },
      { position: 8, answer: "postponed" }
    ]
  },
  {
    sentence: "All staff members must follow the updated safety procedures implemented last week.",
    blanks: [
      { position: 3, answer: "members" },
      { position: 6, answer: "follow" },
      { position: 9, answer: "safety" }
    ]
  },
  {
    sentence: "The design team created multiple prototypes before finalizing the product layout.",
    blanks: [
      { position: 3, answer: "team" },
      { position: 4, answer: "created" },
      { position: 6, answer: "prototypes" }
    ]
  },
  {
    sentence: "The government announced new tax regulations that will affect small businesses.",
    blanks: [
      { position: 3, answer: "announced" },
      { position: 6, answer: "regulations" },
      { position: 10, answer: "businesses" }
    ]
  },
  {
    sentence: "The conference attracted thousands of attendees from various countries and industries.",
    blanks: [
      { position: 3, answer: "attracted" },
      { position: 5, answer: "thousands" },
      { position: 9, answer: "attendees" }
    ]
  },
  {
    sentence: "To enhance brand awareness, the company invested heavily in digital advertising.",
    blanks: [
      { position: 2, answer: "enhance" },
      { position: 4, answer: "brand" },
      { position: 9, answer: "invested" }
    ]
  },
  {
    sentence: "The airline upgraded its booking system to provide a more convenient user experience.",
    blanks: [
      { position: 3, answer: "upgraded" },
      { position: 6, answer: "booking" },
      { position: 13, answer: "experience" }
    ]
  },
  {
    sentence: "The training session will cover essential skills needed for effective teamwork.",
    blanks: [
      { position: 3, answer: "session" },
      { position: 6, answer: "essential" },
      { position: 11, answer: "teamwork" }
    ]
  },
  {
    sentence: "Management is reviewing the proposed budget increase for the next fiscal cycle.",
    blanks: [
      { position: 1, answer: "Management" },
      { position: 4, answer: "reviewing" },
      { position: 6, answer: "proposed" }
    ]
  },
  {
    sentence: "The restaurant introduced a seasonal menu featuring fresh ingredients from local farms.",
    blanks: [
      { position: 3, answer: "introduced" },
      { position: 6, answer: "seasonal" },
      { position: 8, answer: "menu" }
    ]
  },
  {
    sentence: "The HR department scheduled interviews with qualified candidates throughout the week.",
    blanks: [
      { position: 2, answer: "HR" },
      { position: 4, answer: "scheduled" },
      { position: 7, answer: "interviews" }
    ]
  },
  {
    sentence: "To improve fuel efficiency, engineers developed a new engine model last year.",
    blanks: [
      { position: 3, answer: "improve" },
      { position: 4, answer: "fuel" },
      { position: 6, answer: "efficiency" }
    ]
  },
  {
    sentence: "The team leader organized a workshop to strengthen communication among coworkers.",
    blanks: [
      { position: 2, answer: "team" },
      { position: 3, answer: "leader" },
      { position: 4, answer: "organized" }
    ]
  },
  {
    sentence: "The research institute published a groundbreaking study on climate change impacts.",
    blanks: [
      { position: 3, answer: "institute" },
      { position: 4, answer: "published" },
      { position: 7, answer: "groundbreaking" }
    ]
  },
  {
    sentence: "The company issued a formal apology after the system outage affected thousands of users.",
    blanks: [
      { position: 3, answer: "issued" },
      { position: 7, answer: "apology" },
      { position: 12, answer: "affected" }
    ]
  },
  {
    sentence: "Customers are encouraged to check product availability on the website before visiting the store.",
    blanks: [
      { position: 4, answer: "encouraged" },
      { position: 6, answer: "check" },
      { position: 7, answer: "product" }
    ]
  },
  {
    sentence: "The committee reviewed all proposals and selected the most innovative solution for implementation.",
    blanks: [
      { position: 2, answer: "committee" },
      { position: 3, answer: "reviewed" },
      { position: 8, answer: "selected" }
    ]
  },

  /* ====== 75/100 ===== */

  {
    sentence: "The customer support team responded promptly to inquiries received over the weekend.",
    blanks: [
      { position: 3, answer: "support" },
      { position: 4, answer: "team" },
      { position: 5, answer: "responded" }
    ]
  },
  {
    sentence: "To expand market reach, the company partnered with several international distributors.",
    blanks: [
      { position: 3, answer: "expand" },
      { position: 4, answer: "market" },
      { position: 7, answer: "partnered" }
    ]
  },
  {
    sentence: "The factory installed new equipment to increase production capacity this quarter.",
    blanks: [
      { position: 3, answer: "installed" },
      { position: 5, answer: "equipment" },
      { position: 8, answer: "increase" }
    ]
  },
  {
    sentence: "The presentation included data charts that highlighted significant sales trends.",
    blanks: [
      { position: 3, answer: "included" },
      { position: 4, answer: "data" },
      { position: 7, answer: "charts" }
    ]
  },
  {
    sentence: "The shipping department handled urgent deliveries to meet tight customer deadlines.",
    blanks: [
      { position: 2, answer: "shipping" },
      { position: 3, answer: "department" },
      { position: 5, answer: "handled" }
    ]
  },
  {
    sentence: "The new subscription plan offers additional features and priority customer support.",
    blanks: [
      { position: 4, answer: "plan" },
      { position: 5, answer: "offers" },
      { position: 6, answer: "additional" }
    ]
  },
  {
    sentence: "The training coordinator arranged several skill-building activities for the participants.",
    blanks: [
      { position: 3, answer: "coordinator" },
      { position: 4, answer: "arranged" },
      { position: 7, answer: "skill-building" }
    ]
  },
  {
    sentence: "The audit team discovered inconsistencies in the financial statements submitted last month.",
    blanks: [
      { position: 3, answer: "team" },
      { position: 4, answer: "discovered" },
      { position: 6, answer: "inconsistencies" }
    ]
  },
  {
    sentence: "Engineers performed safety tests to ensure the machine met industry standards.",
    blanks: [
      { position: 2, answer: "performed" },
      { position: 4, answer: "safety" },
      { position: 9, answer: "standards" }
    ]
  },
  {
    sentence: "The courier service introduced faster delivery options to improve customer satisfaction.",
    blanks: [
      { position: 3, answer: "service" },
      { position: 4, answer: "introduced" },
      { position: 6, answer: "faster" }
    ]
  },
  {
    sentence: "The finance team analyzed quarterly reports to forecast future growth opportunities.",
    blanks: [
      { position: 3, answer: "team" },
      { position: 4, answer: "analyzed" },
      { position: 6, answer: "quarterly" }
    ]
  },
  {
    sentence: "The contract includes specific terms regarding payment schedules and service conditions.",
    blanks: [
      { position: 3, answer: "includes" },
      { position: 4, answer: "specific" },
      { position: 6, answer: "terms" }
    ]
  },
  {
    sentence: "The bank launched a promotional campaign to attract new credit card customers.",
    blanks: [
      { position: 3, answer: "launched" },
      { position: 5, answer: "promotional" },
      { position: 6, answer: "campaign" }
    ]
  },
  {
    sentence: "The technical support team assisted users who experienced issues after the update.",
    blanks: [
      { position: 3, answer: "support" },
      { position: 4, answer: "team" },
      { position: 5, answer: "assisted" }
    ]
  },
  {
    sentence: "The company aims to reduce energy consumption through sustainable practices.",
    blanks: [
      { position: 3, answer: "aims" },
      { position: 6, answer: "reduce" },
      { position: 7, answer: "energy" }
    ]
  },
  {
    sentence: "Applicants must attend the orientation session before beginning their internship program.",
    blanks: [
      { position: 2, answer: "must" },
      { position: 3, answer: "attend" },
      { position: 6, answer: "orientation" }
    ]
  },
  {
    sentence: "Scientists developed a new method to improve water quality in urban areas.",
    blanks: [
      { position: 2, answer: "developed" },
      { position: 4, answer: "method" },
      { position: 6, answer: "improve" }
    ]
  },
  {
    sentence: "The customer survey revealed several concerns that require immediate attention.",
    blanks: [
      { position: 3, answer: "survey" },
      { position: 4, answer: "revealed" },
      { position: 6, answer: "concerns" }
    ]
  },
  {
    sentence: "The distribution center processed all incoming shipments ahead of schedule.",
    blanks: [
      { position: 3, answer: "center" },
      { position: 4, answer: "processed" },
      { position: 7, answer: "shipments" }
    ]
  },
  {
    sentence: "The CEO emphasized the importance of innovation during his speech at the conference.",
    blanks: [
      { position: 3, answer: "emphasized" },
      { position: 6, answer: "importance" },
      { position: 8, answer: "innovation" }
    ]
  },
  {
    sentence: "The travel agency arranged affordable tour packages for families during the holiday season.",
    blanks: [
      { position: 3, answer: "arranged" },
      { position: 4, answer: "affordable" },
      { position: 6, answer: "tour" }
    ]
  },
  {
    sentence: "Engineers upgraded the manufacturing equipment to enhance production efficiency.",
    blanks: [
      { position: 2, answer: "upgraded" },
      { position: 5, answer: "equipment" },
      { position: 10, answer: "efficiency" }
    ]
  },
  {
    sentence: "The software development team launched a beta version for public testing last week.",
    blanks: [
      { position: 4, answer: "team" },
      { position: 5, answer: "launched" },
      { position: 7, answer: "beta" }
    ]
  },
  {
    sentence: "To retain valuable employees, the company introduced several new benefit programs.",
    blanks: [
      { position: 3, answer: "retain" },
      { position: 4, answer: "valuable" },
      { position: 7, answer: "introduced" }
    ]
  },
  {
    sentence: "The meeting agenda includes multiple discussion points related to future expansion.",
    blanks: [
      { position: 3, answer: "agenda" },
      { position: 4, answer: "includes" },
      { position: 6, answer: "multiple" }
    ]
  },
  {
    sentence: "The organization partnered with local communities to promote environmental awareness.",
    blanks: [
      { position: 2, answer: "organization" },
      { position: 3, answer: "partnered" },
      { position: 7, answer: "communities" }
    ]
  },

  /* ====== 100/100 ===== */
];

// Tạo dữ liệu cho file Excel
const generateExcelData = () => {
  return questionsData.map((item, idx) => {
    // Tạo các cột Blank 1, Blank 2,... cho từng câu hỏi
    const blanks = {};
    item.blanks.forEach((b, index) => {
      blanks[`Blank ${index + 1}`] = `${b.position}: ${b.answer}`;
    });

    // Thêm các cột còn lại nếu câu hỏi ít blanks hơn
    for (let i = item.blanks.length; i < 10; i++) {
      blanks[`Blank ${i + 1}`] = ''; // Nếu ít hơn 10 blank, fill bằng chuỗi rỗng
    }

    return {
      STT: idx + 1,
      "Câu hỏi": item.sentence,
      ...blanks, // Spread các cột blank vào đối tượng kết quả
    };
  });
};

// Hàm tạo file Excel và lưu vào thư mục
export const generateExcelFile = async () => {
  try {
    // Dữ liệu sẽ được chuyển đổi thành Excel
    const excelData = generateExcelData();
    const ws = utils.json_to_sheet(excelData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Questions");

    // Tạo tên file dựa trên thời gian hiện tại
    const fileName = `questions-${Date.now()}.xlsx`;
    const filePath = path.join(lessonsDir, fileName);

    // Ghi file vào thư mục uploads
    writeFile(wb, filePath);

    console.log(`File Excel đã được tạo tại: ${filePath}`);

    // Trả về đường dẫn đến file Excel
    return filePath;
  } catch (error) {
    console.error("Lỗi khi tạo file Excel:", error);
    throw new Error("Không thể tạo file Excel");
  }
};
