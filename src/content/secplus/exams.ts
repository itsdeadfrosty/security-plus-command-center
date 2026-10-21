import type { Certification, ExamVersion } from "@/lib/types";

// Domains, weights and objective numbers are taken from CompTIA's published
// exam objective documents (SY0-701; SY0-801 "Exam Objectives Document
// Version 2.0"). This app is not affiliated with CompTIA.

export const secPlus701: Certification = {
  id: "comptia-secplus",
  name: "Security+",
  examVersion: "SY0-701",
  status: "Available now. Retirement is expected around mid-2027 (date not yet confirmed by CompTIA).",
  maxQuestions: 90,
  durationMinutes: 90,
  passingScore: "750 on a 100–900 scale",
  domains: [
    {
      id: "1.0",
      name: "General Security Concepts",
      weight: 0.12,
      objectives: [
        { id: "1.1", title: "Compare and contrast various types of security controls" },
        { id: "1.2", title: "Summarize fundamental security concepts" },
        { id: "1.3", title: "Explain the importance of change management processes and the impact to security" },
        { id: "1.4", title: "Explain the importance of using appropriate cryptographic solutions" },
      ],
    },
    {
      id: "2.0",
      name: "Threats, Vulnerabilities, and Mitigations",
      weight: 0.22,
      objectives: [
        { id: "2.1", title: "Compare and contrast common threat actors and motivations" },
        { id: "2.2", title: "Explain common threat vectors and attack surfaces" },
        { id: "2.3", title: "Explain various types of vulnerabilities" },
        { id: "2.4", title: "Given a scenario, analyze indicators of malicious activity" },
        { id: "2.5", title: "Explain the purpose of mitigation techniques used to secure the enterprise" },
      ],
    },
    {
      id: "3.0",
      name: "Security Architecture",
      weight: 0.18,
      objectives: [
        { id: "3.1", title: "Compare and contrast security implications of different architecture models" },
        { id: "3.2", title: "Given a scenario, apply security principles to secure enterprise infrastructure" },
        { id: "3.3", title: "Compare and contrast concepts and strategies to protect data" },
        { id: "3.4", title: "Explain the importance of resilience and recovery in security architecture" },
      ],
    },
    {
      id: "4.0",
      name: "Security Operations",
      weight: 0.28,
      objectives: [
        { id: "4.1", title: "Given a scenario, apply common security techniques to computing resources" },
        { id: "4.2", title: "Explain the security implications of proper hardware, software, and data asset management" },
        { id: "4.3", title: "Explain various activities associated with vulnerability management" },
        { id: "4.4", title: "Explain security alerting and monitoring concepts and tools" },
        { id: "4.5", title: "Given a scenario, modify enterprise capabilities to enhance security" },
        { id: "4.6", title: "Given a scenario, implement and maintain identity and access management" },
        { id: "4.7", title: "Explain the importance of automation and orchestration related to secure operations" },
        { id: "4.8", title: "Explain appropriate incident response activities" },
        { id: "4.9", title: "Given a scenario, use data sources to support an investigation" },
      ],
    },
    {
      id: "5.0",
      name: "Security Program Management and Oversight",
      weight: 0.2,
      objectives: [
        { id: "5.1", title: "Summarize elements of effective security governance" },
        { id: "5.2", title: "Explain elements of the risk management process" },
        { id: "5.3", title: "Explain the processes associated with third-party risk assessment and management" },
        { id: "5.4", title: "Summarize elements of effective security compliance" },
        { id: "5.5", title: "Explain types and purposes of audits and assessments" },
        { id: "5.6", title: "Given a scenario, implement security awareness practices" },
      ],
    },
  ],
};

export const secPlus801: Certification = {
  id: "comptia-secplus",
  name: "Security+",
  examVersion: "SY0-801",
  status: "CompTIA launch date: November 17, 2026.",
  maxQuestions: 90,
  durationMinutes: 90,
  passingScore: "750 on a 100–900 scale",
  domains: [
    {
      id: "1.0",
      name: "General Security Concepts",
      weight: 0.16,
      objectives: [
        { id: "1.1", title: "Explain security concepts and controls" },
        { id: "1.2", title: "Given a scenario, demonstrate the impact of change management processes on security" },
        { id: "1.3", title: "Explain the importance of using appropriate cryptographic solutions" },
      ],
    },
    {
      id: "2.0",
      name: "Threats, Vulnerabilities, and Attacks",
      weight: 0.24,
      objectives: [
        { id: "2.1", title: "Explain characteristics of threats and vulnerabilities" },
        { id: "2.2", title: "Describe common threat actors and motivations" },
        { id: "2.3", title: "Describe threat vectors and sources" },
        { id: "2.4", title: "Explain types of vulnerabilities and attack surfaces" },
        { id: "2.5", title: "Given a scenario, analyze indicators of malicious activity" },
        { id: "2.6", title: "Summarize threats and vulnerabilities associated with artificial intelligence (AI) usage" },
      ],
    },
    {
      id: "3.0",
      name: "Security Architecture",
      weight: 0.19,
      objectives: [
        { id: "3.1", title: "Compare and contrast security implications of different architecture models" },
        { id: "3.2", title: "Given a scenario, manage the security architecture to best protect the infrastructure" },
        { id: "3.3", title: "Summarize concepts and strategies used to protect data" },
        { id: "3.4", title: "Explain the importance of resilience and recovery in security architecture" },
      ],
    },
    {
      id: "4.0",
      name: "Security Operations",
      weight: 0.27,
      objectives: [
        { id: "4.1", title: "Given a scenario, apply mitigating controls, techniques, and solutions to secure the environment" },
        { id: "4.2", title: "Explain the security implications of proper hardware, software, and data asset management" },
        { id: "4.3", title: "Given a scenario, perform tasks associated with vulnerability management" },
        { id: "4.4", title: "Explain security alerting and monitoring concepts and tools" },
        { id: "4.5", title: "Given a scenario, apply concepts related to identity and access management" },
        { id: "4.6", title: "Given a scenario, apply automation and orchestration solutions to secure operations" },
        { id: "4.7", title: "Summarize concepts associated with incident response activities" },
        { id: "4.8", title: "Given a scenario, use data, artifacts and sources to support a security investigation" },
      ],
    },
    {
      id: "5.0",
      name: "Security Program Management and Oversight",
      weight: 0.14,
      objectives: [
        { id: "5.1", title: "Explain the importance of governance, risk, and compliance artifacts" },
        { id: "5.2", title: "Explain the impact of risk management processes on the security of the organization" },
        { id: "5.3", title: "Explain the assessment and management processes associated with third-party risk" },
        { id: "5.4", title: "Summarize elements of effective security compliance" },
        { id: "5.5", title: "Explain concepts associated with audit and assessment activities" },
        { id: "5.6", title: "Given a scenario, apply security awareness concepts to improve organizational security" },
      ],
    },
  ],
};

export const exams: Record<ExamVersion, Certification> = { "SY0-701": secPlus701, "SY0-801": secPlus801 };
