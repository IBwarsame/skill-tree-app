export type NodeStatus = "completed" | "in_progress" | "locked";

export interface SkillNode {
  id: string;
  title: string;
  abbr: string; // short label shown on the node itself - swap for a logo later
  status: NodeStatus;
  description: string;
  requirement: string;
  proofLink?: string;
  // position on the canvas, percent-based (0-100), so it scales with container size
  x: number;
  y: number;
}

export type EdgeKind = "prereq" | "requirement";
// "prereq" = a real dependency chain, drawn solid, and where the node visually branches from.
// "requirement" = a soft unlock condition (must complete these too), drawn dashed.

export interface SkillEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

// One board = one canvas on the easel, with its own name and its own tree.
// skillBoards below is the full set - the carousel on the page just loops
// over this array, so adding a new canvas is adding a new entry here.
export interface SkillBoard {
  id: string;
  title: string;
  nodes: SkillNode[];
  edges: SkillEdge[];
}

export const skillBoards: SkillBoard[] = [
  {
    id: "devops",
    title: "DevOps skill tree",
    nodes: [
      {
        id: "linux",
        title: "Linux fundamentals",
        abbr: "LNX",
        status: "locked",
        description: "File system, permissions, processes, core CLI tools.",
        requirement: "Comfortable navigating and managing a Linux system from the terminal.",
        proofLink: "",
        x: 50,
        y: 90,
      },
      {
        id: "bash",
        title: "Bash scripting",
        abbr: "BASH",
        status: "locked",
        description: "Variables, conditionals, loops, functions, pipes, redirection.",
        requirement: "Write a working automation script (e.g. a backup script).",
        proofLink: "",
        x: 50,
        y: 74,
      },
      {
        id: "docker",
        title: "Docker",
        abbr: "DKR",
        status: "locked",
        description: "Images, containers, Dockerfiles, Docker Compose.",
        requirement: "Containerise a full-stack app and run it with Docker Compose.",
        proofLink: "",
        x: 22,
        y: 58,
      },
      {
        id: "kubernetes",
        title: "Kubernetes",
        abbr: "K8S",
        status: "locked",
        description: "Pods, deployments, services, replica sets.",
        requirement: "Write working K8s manifests for a containerised app.",
        proofLink: "",
        x: 22,
        y: 40,
      },
      {
        id: "aws",
        title: "AWS fundamentals",
        abbr: "AWS",
        status: "locked",
        description: "EC2, S3, IAM, VPC basics.",
        requirement: "Pass AWS Cloud Practitioner, or deploy something real to AWS.",
        proofLink: "",
        x: 78,
        y: 58,
      },
      {
        id: "terraform",
        title: "Terraform / IaC",
        abbr: "TF",
        status: "locked",
        description: "Provisioning cloud infrastructure as code.",
        requirement: "Provision at least one real AWS resource with a Terraform config.",
        proofLink: "",
        x: 78,
        y: 40,
      },
      {
        id: "cicd",
        title: "CI/CD pipelines",
        abbr: "CI",
        status: "locked",
        description: "Automated build, test, and deploy with GitHub Actions.",
        requirement:
          "Complete both the containers branch and the cloud branch first, then build a pipeline that builds a container and deploys it on push.",
        proofLink: "",
        x: 50,
        y: 20,
      },
    ],
    edges: [
      { from: "linux", to: "bash", kind: "prereq" },
      { from: "bash", to: "docker", kind: "prereq" },
      { from: "bash", to: "aws", kind: "prereq" },
      { from: "docker", to: "kubernetes", kind: "prereq" },
      { from: "aws", to: "terraform", kind: "prereq" },
      { from: "bash", to: "cicd", kind: "prereq" },
      { from: "kubernetes", to: "cicd", kind: "requirement" },
      { from: "aws", to: "cicd", kind: "requirement" },
    ],
  },
  {
    // Placeholder second canvas - empty on purpose. Fill in `nodes`/`edges`
    // the same way as the devops board above once this path is decided,
    // and rename `title` to match.
    id: "board-2",
    title: "New skill tree",
    nodes: [],
    edges: [],
  },
];
