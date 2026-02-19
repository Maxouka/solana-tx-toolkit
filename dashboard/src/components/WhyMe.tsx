import {
  Code2,
  Cpu,
  Package,
  Landmark,
  LayoutDashboard,
  Database,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import type { Tab } from '../types'

interface WhyMeProps {
  onNavigate: (tab: Tab) => void
}

interface SkillCard {
  skill: string
  icon: typeof Code2
  accent: 'purple' | 'green'
  evidence: string[]
  link?: { label: string; tab: Tab } | { label: string; href: string }
}

const skills: SkillCard[] = [
  {
    skill: 'Rust Backend Development',
    icon: Code2,
    accent: 'purple',
    evidence: [
      'tx-optimizer crate: async Rust with Tokio runtime',
      'Custom retry logic, exponential backoff, error handling',
      'Modular architecture with clean trait boundaries',
    ],
    link: {
      label: 'View on GitHub',
      href: 'https://github.com/Maxouka/solana-tx-toolkit/tree/master/crates/tx-optimizer',
    },
  },
  {
    skill: 'Solana Transaction Optimization',
    icon: Cpu,
    accent: 'green',
    evidence: [
      'Priority fee estimation across p25/p50/p75/p90 percentiles',
      'Compute budget optimization and transaction simulation',
      'Configurable fee strategies (economy to turbo)',
    ],
    link: { label: 'See Fee Explorer', tab: 'fees' as Tab },
  },
  {
    skill: 'SDKs: web3.js, Jupiter, SPL, Jito',
    icon: Package,
    accent: 'purple',
    evidence: [
      'TypeScript SDK wrapping all four Solana SDKs',
      'Jupiter V6 multi-hop route optimization with slippage control',
      'Jito bundle construction with tip accounts and status tracking',
    ],
    link: { label: 'See Swap Router', tab: 'swap' as Tab },
  },
  {
    skill: 'On-Chain Programs (Anchor)',
    icon: Landmark,
    accent: 'green',
    evidence: [
      'tx-vault: 4 instructions (init, deposit, batch execute, close)',
      'PDA derivation, CPI to System Program, account validation',
      'Custom errors, events, and Anchor account macros',
    ],
    link: {
      label: 'View on GitHub',
      href: 'https://github.com/Maxouka/solana-tx-toolkit/tree/master/programs/tx-vault',
    },
  },
  {
    skill: 'React Dashboard',
    icon: LayoutDashboard,
    accent: 'purple',
    evidence: [
      'This dashboard: Vite + React 18 + TailwindCSS + Recharts',
      '20+ components with real-time data viz and animations',
      'Responsive layout, dark theme, production build pipeline',
    ],
    link: { label: 'See Bundle Tracker', tab: 'bundles' as Tab },
  },
  {
    skill: 'PostgreSQL',
    icon: Database,
    accent: 'green',
    evidence: [
      'Schema designed for tx history, fee snapshots, and bundle logs',
      'Architecture layer ready for persistence integration',
      'Not deployed here — static demo, but schema is production-modeled',
    ],
  },
  {
    skill: 'Git Workflow',
    icon: GitBranch,
    accent: 'purple',
    evidence: [
      'Clean commit history with conventional commit messages',
      'Monorepo structure: Rust workspace + TS + React + Anchor',
      'GitHub Pages CI/CD deployment from docs/ folder',
    ],
    link: {
      label: 'View Commits',
      href: 'https://github.com/Maxouka/solana-tx-toolkit/commits/master',
    },
  },
]

export default function WhyMe({ onNavigate }: WhyMeProps) {
  const total = skills.length
  const covered = total // all covered

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-sol-border bg-gradient-to-br from-sol-card via-sol-card to-sol-purple/5 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sol-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            What This Project Demonstrates
          </h1>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl leading-relaxed">
            Every component of this toolkit was built to demonstrate the exact
            technical skills required for this role. Each card below maps a job
            requirement to concrete, working code you can explore.
          </p>
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {skills.map((card, i) => (
          <SkillCardComponent key={card.skill} card={card} index={i} onNavigate={onNavigate} />
        ))}
      </div>

      {/* Coverage bar */}
      <div className="bg-sol-card/80 backdrop-blur-sm rounded-xl p-4 border border-sol-border flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-sol-green" />
          <span className="text-sm font-semibold text-white">
            {covered}/{total} requirements covered
          </span>
        </div>
        <div className="flex-1 h-2 bg-sol-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sol-purple to-sol-green rounded-full transition-all duration-1000"
            style={{ width: `${(covered / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-sol-green font-bold">100%</span>
      </div>
    </div>
  )
}

function SkillCardComponent({
  card,
  index,
  onNavigate,
}: {
  card: SkillCard
  index: number
  onNavigate: (tab: Tab) => void
}) {
  const Icon = card.icon
  const isPurple = card.accent === 'purple'

  // Use full class names so Tailwind can purge correctly
  const styles = isPurple
    ? {
        iconBox: 'bg-sol-purple/10 border-sol-purple/20',
        iconText: 'text-sol-purple',
        tag: 'text-sol-purple/70',
        dot: 'bg-sol-purple/60',
        link: 'text-sol-purple',
        borderColor: '#9945FF',
        glow: 'rgba(153,69,255,0.15)',
      }
    : {
        iconBox: 'bg-sol-green/10 border-sol-green/20',
        iconText: 'text-sol-green',
        tag: 'text-sol-green/70',
        dot: 'bg-sol-green/60',
        link: 'text-sol-green',
        borderColor: '#14F195',
        glow: 'rgba(20,241,149,0.15)',
      }

  const handleLink = () => {
    if (!card.link) return
    if ('tab' in card.link) {
      onNavigate(card.link.tab)
    } else {
      window.open(card.link.href, '_blank')
    }
  }

  return (
    <div
      className="group relative bg-sol-card/60 backdrop-blur-sm rounded-xl border border-sol-border hover:border-opacity-60 transition-all duration-300 overflow-hidden"
      style={{
        animationDelay: `${index * 80}ms`,
        borderLeftWidth: '3px',
        borderLeftColor: styles.borderColor,
        boxShadow: `inset 3px 0 12px -4px ${styles.glow}`,
      }}
    >
      <div className="p-5 flex flex-col h-full">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-lg border ${styles.iconBox}`}
            >
              <Icon size={18} className={styles.iconText} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {card.skill}
              </h3>
              <span className={`text-[10px] font-semibold uppercase tracking-widest ${styles.tag}`}>
                Required
              </span>
            </div>
          </div>
        </div>

        {/* Evidence bullets */}
        <ul className="flex-1 space-y-2 mb-4">
          {card.evidence.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
              <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${styles.dot}`} />
              {item}
            </li>
          ))}
        </ul>

        {/* Link button */}
        {card.link && (
          <button
            onClick={handleLink}
            className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:text-white transition-colors duration-200 group/link ${styles.link}`}
          >
            {'tab' in card.link ? (
              <>
                <ArrowRight size={13} className="transition-transform group-hover/link:translate-x-0.5" />
                <span>{card.link.label}</span>
              </>
            ) : (
              <>
                <ExternalLink size={13} />
                <span>{card.link.label}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
