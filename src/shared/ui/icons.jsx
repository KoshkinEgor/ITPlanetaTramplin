export {
  Heart as HeartIcon,
  Ellipsis as MoreIcon,
  ChevronDown as ChevronDownIcon,
  ArrowDownUp as SortIcon,
  ArrowDown as DirectionIcon,
  SlidersHorizontal as SlidersIcon,
  Globe as GlobeIcon,
  Link as LinkIcon,
  Send as TelegramIcon,
  X as CloseIcon,
  Search as SearchIcon,
  Bell as BellIcon,
  Mail as MailIcon,
  MapPin as PinIcon,
  Menu as MenuIcon,
  MessageCircle as MessageIcon,
  UserRound as GuestProfileIcon,
  AlertTriangle as AlertIcon,
  Radio as StreamIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  ArrowRight as ArrowIcon,
  Sparkles as SparkIcon,
  Ban as BlockIcon,
  ChevronRight as ChevronRightIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowUp as ArrowUpIcon,
  Check as SuccessIcon,
  AlertTriangle as WarningIcon,
  AlertCircle as ErrorIcon,
  Info as InfoIcon,
  ImagePlus as MediaUploadIcon,
  Play as PlayBadgeIcon,
  Trash2 as TrashIcon,
  UserRound as CandidateIcon,
  Building2 as EmployerIcon,
  ShieldCheck as CuratorIcon,
  Maximize2 as MaximizeIcon,
  Minimize2 as MinimizeIcon,
} from "lucide-react";

// YouTube — нет в lucide, кастомный SVG
export function YoutubeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.5 7.5 4 2.5-4 2.5v-5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// GitHub — нет в lucide, кастомный SVG
export function GithubIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2a8 8 0 0 0-2.5 15.6c.4.1.5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.4.7 0-.5.2-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.2 0-.2-.3-1 .1-2.1 0 0 .7-.2 2.2.8A7.8 7.8 0 0 1 10 6c.7 0 1.4.1 2 .3 1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.3.6.8.6 1.6v2.4c0 .2.1.5.5.4A8 8 0 0 0 10 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// VK — нет в lucide, кастомный SVG
export function VkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.5 5c0 0-.2-.5-.7-.7-.5-.2-1-.2-1-.2h-2c-.3 0-.6.2-.8.5 0 0-.8 1.6-1.8 2.8-1 .9-1.4 1.1-1.6.9-.2-.2-.2-.8-.2-1.3v-2.3c0-.4-.1-.7-.3-.9-.3-.2-.7-.2-1.2-.2H6.6c-.3 0-.6.1-.8.3-.3.2-.3.5 0 .5.3 0 .8.2.9.6.2.4.2 1.2.2 1.2s-.1.8-.4 1c-.3.2-.6 0-1.1-.6-.8-1.1-1.5-2.5-1.5-2.5s-.2-.3-.5-.4c-.3-.1-.8-.1-.8-.1H1c-.3 0-.5.2-.5.4 0 .3.5 1.8 2.2 4.1C4.7 13.7 7 15 9.2 15h1c.4 0 .8-.1.9-.3.2-.2.2-.6.2-1.2v-.8c0-.4.3-.5.6-.2.4.4.9 1.1 1.6 1.6.5.4 1.1.7 1.7.7h2c.4 0 .8-.2.9-.5 0-.1.3-1 .1-1.8-.2-.7-.8-1.5-1.2-2-.3-.4-.5-.6-.4-.9.2-.3 1-1.6 1.9-3.2.7-1 .8-1.3.8-1.4z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
