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
    skill: 'Rust Backend',
    icon: Code2,
    accent: 'purple',
    evidence: [
      'Crate tx-optimizer : Rust async avec Tokio runtime',
      'Retry logic, exponential backoff, gestion d\'erreurs',
      'Architecture modulaire avec des trait boundaries cleans',
    ],
    link: {
      label: 'Voir sur GitHub',
      href: 'https://github.com/Maxouka/solana-tx-toolkit/tree/master/crates/tx-optimizer',
    },
  },
  {
    skill: 'Optimisation de Transactions Solana',
    icon: Cpu,
    accent: 'green',
    evidence: [
      'Estimation des priority fees par percentiles (p25/p50/p75/p90)',
      'Optimisation du compute budget et simulation de transactions',
      'Strategies de fees configurables (economy a turbo)',
    ],
    link: { label: 'Voir Fee Explorer', tab: 'fees' as Tab },
  },
  {
    skill: 'SDKs : web3.js, Jupiter, SPL, Jito',
    icon: Package,
    accent: 'purple',
    evidence: [
      'SDK TypeScript integrant les 4 SDKs Solana',
      'Optimisation de routes Jupiter V6 multi-hop avec slippage',
      'Construction de bundles Jito avec tip accounts et suivi de statut',
    ],
    link: { label: 'Voir Swap Router', tab: 'swap' as Tab },
  },
  {
    skill: 'Programmes On-Chain (Anchor)',
    icon: Landmark,
    accent: 'green',
    evidence: [
      'tx-vault : 4 instructions (init, deposit, batch execute, close)',
      'Derivation de PDAs, CPI vers System Program, validation de comptes',
      'Erreurs custom, events et macros Anchor',
    ],
    link: {
      label: 'Voir sur GitHub',
      href: 'https://github.com/Maxouka/solana-tx-toolkit/tree/master/programs/tx-vault',
    },
  },
  {
    skill: 'Dashboard React',
    icon: LayoutDashboard,
    accent: 'purple',
    evidence: [
      'Ce dashboard : Vite + React 18 + TailwindCSS + Recharts',
      '20+ composants avec data viz temps reel et animations',
      'Layout responsive, dark theme, pipeline de build production',
    ],
    link: { label: 'Voir Bundle Tracker', tab: 'bundles' as Tab },
  },
  {
    skill: 'PostgreSQL',
    icon: Database,
    accent: 'green',
    evidence: [
      'Schema concu pour historique tx, snapshots de fees et logs de bundles',
      'Couche architecture prete pour integration persistence',
      'Demo statique ici, mais le schema est production-ready',
    ],
  },
  {
    skill: 'Workflow Git',
    icon: GitBranch,
    accent: 'purple',
    evidence: [
      'Historique de commits clean avec conventional commits',
      'Monorepo : Rust workspace + TS + React + Anchor',
      'Deploiement GitHub Pages CI/CD depuis le dossier docs/',
    ],
    link: {
      label: 'Voir les Commits',
      href: 'https://github.com/Maxouka/solana-tx-toolkit/commits/master',
    },
  },
]

export default function WhyMe({ onNavigate }: WhyMeProps) {
  const total = skills.length
  const covered = total

  return (
    <div className="flex flex-col gap-6">
      {/* Big title */}
      <div className="relative pt-2 pb-4">
        <div className="absolute top-0 left-0 w-96 h-40 bg-sol-purple/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-12 w-64 h-32 bg-sol-green/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-5xl font-black text-white tracking-tight uppercase">
            Pourquoi <span className="text-sol-purple">Moi</span>
          </h1>
          <p className="mt-3 text-sm text-gray-400 max-w-2xl leading-relaxed">
            Chaque composant de ce toolkit a ete construit pour demontrer les competences
            techniques exactes requises pour ce poste. Chaque carte ci-dessous associe
            une exigence du poste a du code fonctionnel que vous pouvez explorer.
          </p>
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {skills.map((card, i) => (
          <SkillCardComponent key={card.skill} card={card} index={i} onNavigate={onNavigate} />
        ))}
      </div>

      {/* Coverage bar */}
      <div className="bg-sol-card/80 backdrop-blur-sm rounded-xl p-4 border border-sol-border flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-sol-green" />
          <span className="text-sm font-semibold text-white">
            {covered}/{total} exigences couvertes
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
      className="group relative bg-sol-card/60 backdrop-blur-sm rounded-xl border border-sol-border hover:border-opacity-60 transition-all duration-300"
      style={{
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
                Requis
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
