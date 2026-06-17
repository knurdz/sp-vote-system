import type { Project } from '@/types'

const base = '2026-06-01T00:00:00.000Z'

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Smart Grid Monitoring Platform',
    company: 'NovaEnergy Ltd',
    description:
      'Real-time IoT dashboard for monitoring distributed energy assets across regional substations with predictive maintenance alerts.',
    tech_stack: ['React', 'Node.js', 'PostgreSQL', 'MQTT'],
    team_size: 4,
    voting_deadline: '2026-06-20T23:59:00.000Z',
    status: 'voting',
    created_by: null,
    created_at: base,
  },
  {
    id: '2',
    title: 'Hospital Queue Management System',
    company: 'MedFlow Systems',
    description:
      'Patient flow optimization for outpatient clinics with SMS notifications and admin analytics.',
    tech_stack: ['Vue', 'Firebase', 'Twilio'],
    team_size: 3,
    voting_deadline: '2026-07-01T23:59:00.000Z',
    status: 'voting',
    created_by: null,
    created_at: base,
  },
  {
    id: '3',
    title: 'Fleet Logistics Tracker',
    company: 'TransRoute Inc',
    description:
      'GPS-based fleet management with route optimization and driver performance scoring.',
    tech_stack: ['React Native', 'Python', 'Redis'],
    team_size: 5,
    voting_deadline: '2026-07-15T23:59:00.000Z',
    status: 'upcoming',
    created_by: null,
    created_at: base,
  },
  {
    id: '4',
    title: 'E-Learning Assessment Portal',
    company: 'EduSphere',
    description:
      'Automated grading and plagiarism detection for university coursework submissions.',
    tech_stack: ['Next.js', 'Prisma', 'OpenAI API'],
    team_size: 4,
    voting_deadline: '2026-05-01T23:59:00.000Z',
    status: 'closed',
    created_by: null,
    created_at: base,
  },
  {
    id: '5',
    title: 'Retail Inventory Optimizer',
    company: 'ShopWise',
    description:
      'ML-driven stock replenishment recommendations for multi-store retail chains.',
    tech_stack: ['Python', 'FastAPI', 'TensorFlow'],
    team_size: 3,
    voting_deadline: '2026-04-01T23:59:00.000Z',
    status: 'assigned',
    created_by: null,
    created_at: base,
  },
  {
    id: '6',
    title: 'Cybersecurity Threat Dashboard',
    company: 'ShieldNet',
    description:
      'SOC-style threat visualization with SIEM integration and incident response workflows.',
    tech_stack: ['React', 'Go', 'Elasticsearch'],
    team_size: 4,
    voting_deadline: '2026-08-01T23:59:00.000Z',
    status: 'upcoming',
    created_by: null,
    created_at: base,
  },
]
