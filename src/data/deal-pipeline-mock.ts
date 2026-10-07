import {
  Deal,
  DealPipelineStage,
  DealPipeline,
  DealPipelineStageSummary,
  DealStage,
} from "@/types/deal";

export interface MockCustomer {
  readonly id: string;
  readonly name: string;
}

export interface MockContact {
  readonly id: string;
  readonly name: string;
  readonly customer_id: string;
}

export interface MockOwner {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export const MOCK_DEAL_CUSTOMERS: readonly MockCustomer[] = [
  { id: "cust-001", name: "Apex Holdings Ltd" },
  { id: "cust-002", name: "Lankacom Solutions" },
  { id: "cust-003", name: "Blue Ocean Maritime" },
  { id: "cust-004", name: "Ceylon Tea Traders PLC" },
  { id: "cust-005", name: "Zenith Logistics Ltd" },
  { id: "cust-006", name: "Hayleys Industrial Supply" },
  { id: "cust-007", name: "Cinnamon Grand Ventures" },
  { id: "cust-008", name: "MAS Active Apparel" },
  { id: "cust-009", name: "Dialog Enterprise Corp" },
  { id: "cust-010", name: "QuickFleet Courier" },
] as const;

export const MOCK_DEAL_CONTACTS: readonly MockContact[] = [
  { id: "cont-001", name: "Kamal Perera", customer_id: "cust-001" },
  { id: "cont-002", name: "Niroshan Silva", customer_id: "cust-002" },
  { id: "cont-004", name: "Anura Jayasinghe", customer_id: "cust-004" },
  { id: "cont-005", name: "Dilani Wickramasinghe", customer_id: "cust-005" },
  { id: "cont-006", name: "Roshan Mendis", customer_id: "cust-006" },
  { id: "cont-007", name: "Chathura Dias", customer_id: "cust-007" },
  { id: "cont-008", name: "Priyantha Kumara", customer_id: "cust-008" },
  { id: "cont-009", name: "Sanjeewa Bandara", customer_id: "cust-009" },
  { id: "cont-010", name: "Mahesh Gunasekara", customer_id: "cust-010" },
] as const;

export const MOCK_DEAL_OWNERS: readonly MockOwner[] = [
  { id: "usr-001", name: "Sarah Jenkins", email: "sarah.jenkins@accdoo.com" },
  { id: "usr-002", name: "Dinesh Fernando", email: "dinesh.fernando@accdoo.com" },
  { id: "usr-003", name: "Chaminda Jayawardena", email: "chaminda.j@accdoo.com" },
] as const;

export const DEFAULT_DEAL_STAGE_IDS = {
  NEW: "b1000000-0000-4000-a000-000000000001",
  PROPOSAL: "b1000000-0000-4000-a000-000000000002",
  NEGOTIATION: "b1000000-0000-4000-a000-000000000003",
  WON: "b1000000-0000-4000-a000-000000000004",
  LOST: "b1000000-0000-4000-a000-000000000005",
} as const;

/**
 * Standard stages for Deal Pipeline representing backend defaults.
 */
export const DEFAULT_DEAL_PIPELINE_STAGES: readonly DealPipelineStage[] = [
  {
    id: DEFAULT_DEAL_STAGE_IDS.NEW,
    name: "New",
    color_key: "blue",
    position: 0,
    legacy_stage_key: "new",
    is_entry_stage: true,
    is_system_won: false,
    is_system_lost: false,
    description: "Newly converted or identified opportunities.",
  },
  {
    id: DEFAULT_DEAL_STAGE_IDS.PROPOSAL,
    name: "Proposal",
    color_key: "cyan",
    position: 1,
    legacy_stage_key: "proposal",
    is_entry_stage: false,
    is_system_won: false,
    is_system_lost: false,
    description: "Pitch delivered or formal quote presented.",
  },
  {
    id: DEFAULT_DEAL_STAGE_IDS.NEGOTIATION,
    name: "Negotiation",
    color_key: "amber",
    position: 2,
    legacy_stage_key: "negotiation",
    is_entry_stage: false,
    is_system_won: false,
    is_system_lost: false,
    description: "Contract terms, scope, or pricing discussions.",
  },
  {
    id: DEFAULT_DEAL_STAGE_IDS.WON,
    name: "Won",
    color_key: "green",
    position: 3,
    legacy_stage_key: "won",
    is_entry_stage: false,
    is_system_won: true,
    is_system_lost: false,
    description: "Successfully closed, signed, and booked revenue.",
  },
  {
    id: DEFAULT_DEAL_STAGE_IDS.LOST,
    name: "Lost",
    color_key: "red",
    position: 4,
    legacy_stage_key: "lost",
    is_entry_stage: false,
    is_system_won: false,
    is_system_lost: true,
    description: "Archived or non-converted opportunities.",
  },
] as const;

export const DEFAULT_DEAL_PIPELINE: DealPipeline = {
  id: "pipe-deal-default-000000000001",
  name: "Default Deal Pipeline",
  is_default: true,
  version: 1,
  stages: DEFAULT_DEAL_PIPELINE_STAGES,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};

/**
 * Realistic initial mock deals reflecting AccDoo CRM commercial accounts.
 */
export const INITIAL_MOCK_DEALS: readonly Deal[] = [
  // Stage: New
  {
    id: "deal-001",
    title: "Enterprise Cloud Migration",
    stage: "new",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.NEW,
    customer_id: "cust-001",
    customer_name: "Apex Holdings Ltd",
    contact_id: "cont-001",
    contact_name: "Kamal Perera",
    value: 1850000,
    expected_close_date: "2026-11-15",
    assigned_to_user_id: "usr-001",
    assigned_to_name: "Sarah Jenkins",
    notes: "Client requires hybrid AWS and Azure migration roadmap.",
    closed_at: null,
    created_at: "2026-10-01T09:00:00Z",
    updated_at: "2026-10-01T09:00:00Z",
  },
  {
    id: "deal-002",
    title: "Annual Security Audit Contract",
    stage: "new",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.NEW,
    customer_id: "cust-002",
    customer_name: "Lankacom Solutions",
    contact_id: "cont-002",
    contact_name: "Niroshan Silva",
    value: 420000,
    expected_close_date: "2026-12-01",
    assigned_to_user_id: "usr-002",
    assigned_to_name: "Dinesh Fernando",
    notes: "ISO 27001 readiness review and penetration testing package.",
    closed_at: null,
    created_at: "2026-10-02T11:30:00Z",
    updated_at: "2026-10-02T11:30:00Z",
  },
  {
    id: "deal-003",
    title: "Hardware Infrastructure Renewal",
    stage: "new",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.NEW,
    customer_id: "cust-003",
    customer_name: "Blue Ocean Maritime",
    contact_id: null,
    contact_name: null,
    value: 950000,
    expected_close_date: "2026-11-28",
    assigned_to_user_id: "usr-001",
    assigned_to_name: "Sarah Jenkins",
    notes: "Branch firewall and edge router refresh for port terminals.",
    closed_at: null,
    created_at: "2026-10-03T14:15:00Z",
    updated_at: "2026-10-03T14:15:00Z",
  },

  // Stage: Proposal
  {
    id: "deal-004",
    title: "CRM Enterprise License & Customization",
    stage: "proposal",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.PROPOSAL,
    customer_id: "cust-004",
    customer_name: "Ceylon Tea Traders PLC",
    contact_id: "cont-004",
    contact_name: "Anura Jayasinghe",
    value: 3200000,
    expected_close_date: "2026-10-30",
    assigned_to_user_id: "usr-002",
    assigned_to_name: "Dinesh Fernando",
    notes: "Includes export pipeline workflow and multi-currency billing module.",
    closed_at: null,
    created_at: "2026-09-22T08:45:00Z",
    updated_at: "2026-10-04T10:20:00Z",
  },
  {
    id: "deal-005",
    title: "VoIP Unified Communications Setup",
    stage: "proposal",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.PROPOSAL,
    customer_id: "cust-005",
    customer_name: "Zenith Logistics Ltd",
    contact_id: "cont-005",
    contact_name: "Dilani Wickramasinghe",
    value: 780000,
    expected_close_date: "2026-11-10",
    assigned_to_user_id: "usr-001",
    assigned_to_name: "Sarah Jenkins",
    notes: "PBX migration to SIP trunking across 4 distribution hubs.",
    closed_at: null,
    created_at: "2026-09-28T16:00:00Z",
    updated_at: "2026-10-05T09:10:00Z",
  },

  // Stage: Negotiation
  {
    id: "deal-006",
    title: "Core ERP Implementation & Integration",
    stage: "negotiation",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.NEGOTIATION,
    customer_id: "cust-006",
    customer_name: "Hayleys Industrial Supply",
    contact_id: "cont-006",
    contact_name: "Roshan Mendis",
    value: 5600000,
    expected_close_date: "2026-10-25",
    assigned_to_user_id: "usr-002",
    assigned_to_name: "Dinesh Fernando",
    notes: "Contract review under legal team. Payment milestones being finalized.",
    closed_at: null,
    created_at: "2026-09-10T13:20:00Z",
    updated_at: "2026-10-06T15:40:00Z",
  },
  {
    id: "deal-007",
    title: "Omnichannel Support Suite Expansion",
    stage: "negotiation",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.NEGOTIATION,
    customer_id: "cust-007",
    customer_name: "Cinnamon Grand Ventures",
    contact_id: "cont-007",
    contact_name: "Chathura Dias",
    value: 1450000,
    expected_close_date: "2026-10-28",
    assigned_to_user_id: "usr-001",
    assigned_to_name: "Sarah Jenkins",
    notes: "Discussing SLA response time tier upgrades and WhatsApp Business API seats.",
    closed_at: null,
    created_at: "2026-09-18T10:00:00Z",
    updated_at: "2026-10-04T12:00:00Z",
  },

  // Stage: Won
  {
    id: "deal-008",
    title: "Disaster Recovery Cloud Backup",
    stage: "won",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.WON,
    customer_id: "cust-008",
    customer_name: "MAS Active Apparel",
    contact_id: "cont-008",
    contact_name: "Priyantha Kumara",
    value: 2100000,
    expected_close_date: "2026-10-02",
    assigned_to_user_id: "usr-002",
    assigned_to_name: "Dinesh Fernando",
    notes: "Contract signed. Onboarding kick-off scheduled with sysops.",
    closed_at: "2026-10-02T16:30:00Z",
    created_at: "2026-08-30T11:10:00Z",
    updated_at: "2026-10-02T16:30:00Z",
  },
  {
    id: "deal-009",
    title: "Network Architecture Modernization",
    stage: "won",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.WON,
    customer_id: "cust-009",
    customer_name: "Dialog Enterprise Corp",
    contact_id: "cont-009",
    contact_name: "Sanjeewa Bandara",
    value: 4350000,
    expected_close_date: "2026-09-28",
    assigned_to_user_id: "usr-001",
    assigned_to_name: "Sarah Jenkins",
    notes: "3-year SD-WAN service level agreement signed.",
    closed_at: "2026-09-28T14:45:00Z",
    created_at: "2026-08-15T09:30:00Z",
    updated_at: "2026-09-28T14:45:00Z",
  },

  // Stage: Lost
  {
    id: "deal-010",
    title: "Custom Mobile App Development",
    stage: "lost",
    pipeline_stage_id: DEFAULT_DEAL_STAGE_IDS.LOST,
    customer_id: "cust-010",
    customer_name: "QuickFleet Courier",
    contact_id: "cont-010",
    contact_name: "Mahesh Gunasekara",
    value: 850000,
    expected_close_date: "2026-09-15",
    assigned_to_user_id: "usr-002",
    assigned_to_name: "Dinesh Fernando",
    notes: "Client chose in-house team due to budget freezes this quarter.",
    closed_at: "2026-09-15T11:00:00Z",
    created_at: "2026-08-10T15:00:00Z",
    updated_at: "2026-09-15T11:00:00Z",
  },
];

/**
 * Calculates deal count and sum of monetary value for a given stage from local deals collection.
 */
export function calculateStageTotals(
  deals: readonly Deal[],
  stage: DealStage
): { count: number; totalValue: number } {
  const stageDeals = deals.filter((d) => d.stage === stage);
  const totalValue = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  return {
    count: stageDeals.length,
    totalValue,
  };
}

/**
 * Calculates aggregate deal count and total value across the entire pipeline.
 */
export function calculatePipelineTotals(
  deals: readonly Deal[]
): { totalCount: number; totalValue: number } {
  const totalCount = deals.length;
  const totalValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  return {
    totalCount,
    totalValue,
  };
}

/**
 * Calculates per-stage metrics for an array of stages.
 */
export function calculatePipelineStageSummaries(
  deals: readonly Deal[],
  stages: readonly DealPipelineStage[]
): readonly DealPipelineStageSummary[] {
  return stages.map((s) => {
    const stageDeals = deals.filter((d) => d.pipeline_stage_id === s.id);
    const totalValue = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    return {
      stage_id: s.id,
      deal_count: stageDeals.length,
      total_value: totalValue,
    };
  });
}
