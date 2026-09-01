import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "demo-data");

function heading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
}

function subheading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
}

function body(text) {
  return new Paragraph({ children: [new TextRun(text)], spacing: { after: 150 } });
}

async function writeDoc(filename, title, sections) {
  const children = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, spacing: { after: 300 } }),
  ];
  for (const section of sections) {
    children.push(heading(section.heading));
    for (const block of section.blocks) {
      children.push(block.type === "sub" ? subheading(block.text) : body(block.text));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  await writeFile(path.join(outDir, filename), buffer);
  console.log(`Wrote ${filename}`);
}

const b = (text) => ({ type: "body", text });
const s = (text) => ({ type: "sub", text });

await writeDoc("Employee_Handbook.docx", "Northstar Technologies — Employee Handbook", [
  {
    heading: "Welcome",
    blocks: [
      b(
        "This handbook applies to all employees of Northstar Technologies, across our Dubai, Doha, and Riyadh offices. It summarizes company policies, expectations, and the resources available to you. Where this handbook references a specific policy document (such as the Leave Policy or Travel Policy), that document is authoritative for the details."
      ),
    ],
  },
  {
    heading: "Working Hours",
    blocks: [
      b(
        "Standard working hours are Sunday through Thursday, 9:00 AM to 6:00 PM, with a one-hour lunch break. Employees in client-facing roles may agree alternate hours with their manager. Core collaboration hours, during which all employees should be reachable, are 11:00 AM to 4:00 PM local time."
      ),
    ],
  },
  {
    heading: "Code of Conduct",
    blocks: [
      b(
        "Employees are expected to act with integrity, treat colleagues and clients with respect, and avoid conflicts of interest. Any gift or hospitality valued above AED 500 from a client or vendor must be disclosed to your manager. Harassment or discrimination of any kind will result in disciplinary action, up to and including termination."
      ),
    ],
  },
  {
    heading: "Remote Work",
    blocks: [
      b(
        "Employees may work remotely up to two days per week with manager approval. Fully remote arrangements require Head of Department approval and are reviewed every six months. Employees working remotely from outside their home country for more than 10 consecutive working days must notify People Operations in advance for tax and compliance reasons."
      ),
    ],
  },
  {
    heading: "IT and Security",
    blocks: [
      b(
        "All company laptops must have disk encryption and the standard endpoint security agent installed before connecting to company systems. Multi-factor authentication is mandatory for email, VPN, and all systems containing client data. Report lost or stolen devices to IT Security within one hour of discovery."
      ),
    ],
  },
  {
    heading: "Probation and Performance Reviews",
    blocks: [
      b(
        "New employees serve a 90-day probation period, with a check-in at day 30 and day 60. Formal performance reviews for all employees occur twice a year, in June and December. Compensation changes are typically effective from the January review cycle."
      ),
    ],
  },
]);

await writeDoc("Leave_Policy.docx", "Northstar Technologies — Leave Policy", [
  {
    heading: "Annual Leave",
    blocks: [
      b(
        "Full-time employees accrue 22 working days of annual leave per calendar year, accrued at a rate of 1.83 days per completed month of service. Leave requests of 3 or more consecutive days require at least 2 weeks' notice to your manager via the HR system."
      ),
      s("Carryover"),
      b(
        "Up to 5 unused annual leave days may be carried over into the following calendar year. Carried-over days must be used by March 31 or they are forfeited. Exceptions require Head of Department approval and are granted only in cases of documented operational necessity."
      ),
    ],
  },
  {
    heading: "Sick Leave",
    blocks: [
      b(
        "Employees are entitled to 15 paid sick days per year. A medical certificate is required for absences of 3 or more consecutive days. Sick leave does not carry over between years and is not paid out on termination."
      ),
    ],
  },
  {
    heading: "Parental Leave",
    blocks: [
      b(
        "Primary caregivers are entitled to 60 calendar days of fully paid parental leave, which may begin up to 2 weeks before the expected due date. Secondary caregivers are entitled to 10 working days of paid leave, to be taken within 6 months of the birth or adoption date. Parental leave requests should be submitted to People Operations at least 8 weeks in advance where possible."
      ),
    ],
  },
  {
    heading: "Unpaid Leave",
    blocks: [
      b(
        "Employees with more than 1 year of service may request up to 30 calendar days of unpaid leave per year, subject to Head of Department and People Operations approval. Unpaid leave requests should be submitted at least 4 weeks in advance."
      ),
    ],
  },
]);

await writeDoc("Travel_Policy.docx", "Northstar Technologies — Business Travel Policy", [
  {
    heading: "Approval",
    blocks: [
      b(
        "All international business travel must be approved by the employee's department manager at least 5 working days before booking, using the Travel Request form in the HR system. Domestic travel within the same country does not require pre-approval but must still be logged for expense tracking."
      ),
    ],
  },
  {
    heading: "Booking and Class of Travel",
    blocks: [
      b(
        "Flights should be booked through the corporate travel portal at least 7 days in advance where possible. Economy class is standard for flights under 5 hours; Premium Economy is permitted for flights over 5 hours. Business class requires Head of Department approval and is reserved for flights over 8 hours or when traveling with a client."
      ),
    ],
  },
  {
    heading: "Accommodation and Per Diem",
    blocks: [
      b(
        "Hotel accommodation should not exceed AED 900 per night in major cities (Dubai, Riyadh, London, New York) or AED 600 per night elsewhere, unless the conference or client venue requires otherwise. A daily meal per diem of AED 250 applies when meals are not included in the hotel rate or covered by a client."
      ),
    ],
  },
  {
    heading: "Expense Reporting",
    blocks: [
      b(
        "All travel expenses must be submitted with receipts through the expense system within 10 working days of returning. Expenses submitted more than 30 days after travel will not be reimbursed except with Finance Director approval. Personal expenses incurred during business travel are not reimbursable."
      ),
    ],
  },
]);

console.log("Done.");
