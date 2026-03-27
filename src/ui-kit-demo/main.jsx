import React, { useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "../styles/tokens.css";
import "../styles/globals.css";
import "../components/ui/index.css";
import "../../styles/ui/ui-kit.css";
import "./ui-kit-demo.css";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  ChoiceGroup,
  EmptyState,
  FormField,
  Input,
  Loader,
  Modal,
  Radio,
  SearchInput,
  SectionHeader,
  Select,
  Switch,
  Tabs,
  Textarea,
} from "../components/ui";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.166 10h11.667" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M10.833 4.167 15.833 10l-5 5.833"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.5 11.698 7.52 16.667 9.167l-4.969 1.646L10 15.833 8.302 10.813 3.333 9.167 8.302 7.52 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.25" y="2.75" width="4.5" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.25" y="2.75" width="4.5" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.25" y="9.25" width="11.5" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TokenCard({ title, caption, background }) {
  return (
    <article className="ui-surface ui-kit-token">
      <div className="ui-kit-token__swatch" style={{ background }} />
      <div className="ui-kit-token__copy">
        <strong className="ui-type-h3">{title}</strong>
        <p className="ui-type-caption">{caption}</p>
      </div>
    </article>
  );
}

function FieldState({ label, children }) {
  return (
    <div className="ui-kit-field-state">
      <span className="ui-kit-field-state__label">{label}</span>
      {children}
    </div>
  );
}

const publicHeadlinePreset = "Senior Product Analyst";
const notificationChannelKeys = ["email", "telegram", "sms"];

function UiKitDemo() {
  const [modalState, setModalState] = useState({ open: false, preset: "default" });
  const [searchValue, setSearchValue] = useState("Product");
  const [companyFieldValue, setCompanyFieldValue] = useState("IT - Planeta");
  const [headlineValue, setHeadlineValue] = useState("");
  const [desiredRoleValue, setDesiredRoleValue] = useState("employer");
  const [notificationSelection, setNotificationSelection] = useState({
    email: true,
    telegram: false,
    sms: true,
  });
  const [bioValue, setBioValue] = useState(
    "I build structured hiring flows, align recruiters with data, and turn vague role briefs into measurable candidate journeys."
  );
  const [dismissedAlerts, setDismissedAlerts] = useState({});
  const primaryModalActionRef = useRef(null);
  const roleOptions = [
    { value: "candidate", label: "Candidate" },
    { value: "employer", label: "Employer" },
    { value: "curator", label: "Curator" },
  ];

  const tabItems = [
    {
      value: "overview",
      label: "Overview",
      badge: "3",
      icon: <PanelIcon />,
      content: (
        <div className="ui-kit-tab-copy">
          <p className="ui-type-body">
            New React wrappers now cover atomic controls plus utility pieces used to compose larger product surfaces.
          </p>
          <div className="ui-kit-inline-row">
            <Badge>Stable API</Badge>
            <Badge tone="success">Ready for pages</Badge>
          </div>
        </div>
      ),
    },
    {
      value: "patterns",
      label: "Patterns",
      icon: <SparkIcon />,
      content: (
        <div className="ui-kit-tab-copy">
          <Alert tone="info" title="Composability first">
            Cards, forms and dashboards can now reuse the same React atoms without the old page-specific CSS.
          </Alert>
        </div>
      ),
    },
    {
      value: "handoff",
      label: "Handoff",
      icon: <ArrowIcon />,
      content: (
        <div className="ui-kit-tab-copy">
          <p className="ui-type-body">
            Direct Figma MCP extraction was rate-limited, so this pass aligns with the accessible web frame and the existing HTML UI kit.
          </p>
        </div>
      ),
    },
  ];

  const verticalTabItems = [
    {
      value: "identity",
      label: "Identity",
      icon: <SearchIcon />,
      badge: "4",
      content: (
        <div className="ui-kit-tab-copy">
          <p className="ui-type-body">
            Search, avatars and presence indicators now share the same surface language for headers, sidebars and compact profile cards.
          </p>
        </div>
      ),
    },
    {
      value: "review",
      label: "Review",
      icon: <PanelIcon />,
      content: (
        <div className="ui-kit-tab-copy">
          <p className="ui-type-body">
            Vertical tabs work for workspace settings, moderation queues and dense multi-step panels where hierarchy matters more than width.
          </p>
        </div>
      ),
    },
    {
      value: "signals",
      label: "Signals",
      icon: <SparkIcon />,
      badge: "2",
      content: (
        <div className="ui-kit-tab-copy">
          <Badge dot>Realtime updates</Badge>
          <p className="ui-type-body">This variant pairs cleanly with badges and status counts in admin-like surfaces.</p>
        </div>
      ),
    },
  ];

  const modalPresets = {
    default: {
      tone: "default",
      size: "md",
      showIcon: false,
      title: "Modal shell for product flows",
      description: "The modal keeps the same rounded geometry and soft-light surface as the rest of the UI kit.",
      body: "Use this shell for compact dialogs, confirmations and focused form steps. Escape and overlay closing are handled by default.",
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
    },
    success: {
      tone: "success",
      size: "sm",
      showIcon: true,
      title: "Candidate moved to shortlist",
      description: "This preset demonstrates a positive confirmation dialog with a tighter width and semantic icon.",
      body: "The hiring team will see the updated status immediately, and the candidate will receive a notification in the activity feed.",
      confirmLabel: "Continue",
      cancelLabel: "Undo",
    },
    warning: {
      tone: "warning",
      size: "lg",
      showIcon: true,
      title: "Archive 18 vacancies",
      description: "Warning tone highlights a destructive or high-attention action without switching to a full error state.",
      body: "Archived vacancies will disappear from public search results, but analytics and candidate responses will remain available in reports.",
      confirmLabel: "Archive",
      cancelLabel: "Keep active",
    },
  };

  const activeModalPreset = modalPresets[modalState.preset] ?? modalPresets.default;
  const selectedNotificationCount = notificationChannelKeys.filter((key) => notificationSelection[key]).length;
  const allNotificationsSelected = selectedNotificationCount === notificationChannelKeys.length;

  return (
    <>
      <main className="ui-kit-page">
        <section className="ui-card ui-kit-hero">
          <span className="ui-kit-hero__eyebrow">React UI kit · second pass</span>
          <div className="ui-kit-hero__copy">
            <h1 className="ui-type-display">Reusable atoms for forms, status, selection and utility flows.</h1>
            <p className="ui-type-body-lg">
              This showcase closes the gap between the static HTML kit and the React layer intended for real product pages.
            </p>
          </div>
          <div className="ui-kit-hero__meta">
            <span className="ui-kit-note">Standalone React demo</span>
            <span className="ui-kit-note">Shared tokens only</span>
            <span className="ui-kit-note">Figma frame cross-check</span>
          </div>
        </section>

        <nav className="ui-surface ui-kit-anchor-row" aria-label="UI kit navigation">
          <Badge as="a" kind="chip" href="#typography" active>
            Typography
          </Badge>
          <Badge as="a" kind="chip" href="#tokens">
            Tokens
          </Badge>
          <Badge as="a" kind="chip" href="#buttons">
            Buttons
          </Badge>
          <Badge as="a" kind="chip" href="#forms">
            Forms
          </Badge>
          <Badge as="a" kind="chip" href="#selection">
            Selection
          </Badge>
          <Badge as="a" kind="chip" href="#status">
            Status
          </Badge>
          <Badge as="a" kind="chip" href="#utilities">
            Utilities
          </Badge>
          <Badge as="a" kind="chip" href="#cards">
            Cards
          </Badge>
        </nav>

        <section className="ui-kit-section" id="typography">
          <SectionHeader
            eyebrow="Typography"
            title="Scale, weight and readable hierarchy"
            description="Manrope stays the base family, with a clear display-to-caption ladder that works across dashboards, forms and cards."
            meta={<Badge>400 / 500 / 600 / 700 / 800</Badge>}
          />

          <div className="ui-kit-grid ui-kit-grid--two">
            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Scale preview</span>
                <div className="ui-kit-type-stack">
                  <div className="ui-kit-type-line">
                    <span className="ui-type-overline">Display</span>
                    <p className="ui-type-display">Build product screens from clean primitives</p>
                    <p className="ui-type-caption">800 · tight spacing · hero and section openers</p>
                  </div>
                  <div className="ui-kit-type-line">
                    <span className="ui-type-overline">H1</span>
                    <p className="ui-type-h1">Component library</p>
                    <p className="ui-type-caption">800 · main section titles</p>
                  </div>
                  <div className="ui-kit-type-line">
                    <span className="ui-type-overline">H2 / H3</span>
                    <p className="ui-type-h2">Cards and utility states</p>
                    <p className="ui-type-h3">Actions, filters and grouped content</p>
                  </div>
                  <div className="ui-kit-type-line">
                    <span className="ui-type-overline">Body / Caption</span>
                    <p className="ui-type-body-lg">Large body text works for intros, rationale and contextual explanations.</p>
                    <p className="ui-type-body">Default body remains muted but readable enough for helper copy and secondary content.</p>
                    <p className="ui-type-caption">Caption is reserved for hints, support text and metadata.</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__head">
                <div className="ui-kit-specimen__copy">
                  <span className="ui-kit-specimen__eyebrow">Font details</span>
                  <h3 className="ui-type-h3">Readable base family</h3>
                </div>
                <Badge kind="tag">Manrope</Badge>
              </div>
              <ul className="ui-kit-list">
                <li>
                  <span>Body size</span>
                  <code>0.96rem</code>
                </li>
                <li>
                  <span>Body line-height</span>
                  <code>1.6</code>
                </li>
                <li>
                  <span>Heading tracking</span>
                  <code>-0.05em</code>
                </li>
                <li>
                  <span>Caption role</span>
                  <code>Hints / meta</code>
                </li>
              </ul>
              <div className="ui-divider" />
              <p className="ui-type-body">
                The scale is tuned for product surfaces first: dense enough for forms and tables, but still expressive in headers.
              </p>
            </Card>
          </div>

        </section>

        <section className="ui-kit-section" id="tokens">
          <SectionHeader
            eyebrow="Tokens"
            title="Color, radius and elevation"
            description="Base tokens remain isolated so future Figma polish can update the look without changing the component contracts."
          />

          <Card className="ui-kit-specimen">
            <div className="ui-kit-token-grid">
              <TokenCard title="Accent Blue" caption="CTA, focus, active states" background="linear-gradient(180deg, #4b98ff 0%, #2f80ff 100%)" />
              <TokenCard title="Accent Lime" caption="Highlights and emphasis" background="linear-gradient(135deg, #e5ff89 0%, #c9ff1f 100%)" />
              <TokenCard title="Surface" caption="Cards, panels and shells" background="linear-gradient(180deg, #ffffff 0%, #edf3fb 100%)" />
              <TokenCard title="Ink" caption="Strong text hierarchy" background="linear-gradient(180deg, #2c3343 0%, #181d2d 100%)" />
            </div>
          </Card>

          <div className="ui-kit-grid ui-kit-grid--two">
            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Radius</span>
                <h3 className="ui-type-h3">Rounded geometry for cards and controls</h3>
              </div>
              <div className="ui-kit-radius-grid">
                <div className="ui-surface ui-kit-shape">
                  <div className="ui-kit-shape__preview ui-kit-shape__preview--sm" />
                  <span className="ui-type-caption">12px - compact controls</span>
                </div>
                <div className="ui-surface ui-kit-shape">
                  <div className="ui-kit-shape__preview ui-kit-shape__preview--md" />
                  <span className="ui-type-caption">18px - inputs and alerts</span>
                </div>
                <div className="ui-surface ui-kit-shape">
                  <div className="ui-kit-shape__preview ui-kit-shape__preview--lg" />
                  <span className="ui-type-caption">32px - cards and hero surfaces</span>
                </div>
              </div>
            </Card>

            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Elevation</span>
                <h3 className="ui-type-h3">Shadow depth for focus and hierarchy</h3>
              </div>
              <div className="ui-kit-shadow-grid">
                <div className="ui-surface ui-kit-elevation">
                  <div className="ui-kit-elevation__preview ui-kit-elevation__preview--soft" />
                  <span className="ui-type-caption">Soft card shadow</span>
                </div>
                <div className="ui-surface ui-kit-elevation">
                  <div className="ui-kit-elevation__preview ui-kit-elevation__preview--strong" />
                  <span className="ui-type-caption">Raised panel shadow</span>
                </div>
                <div className="ui-surface ui-kit-elevation">
                  <div className="ui-kit-elevation__preview ui-kit-elevation__preview--accent" />
                  <span className="ui-type-caption">Primary action glow</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="ui-kit-section" id="buttons">
          <SectionHeader
            eyebrow="Buttons"
            title="Variants, sizes and action states"
            description="Button states remain isolated in modifiers, so the same atom can move between flows without extra selectors."
          />

          <div className="ui-kit-grid ui-kit-grid--two">
            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Variants</span>
                <h3 className="ui-type-h3">Primary, secondary, ghost and danger</h3>
              </div>
              <div className="ui-kit-button-row">
                <Button>Save changes</Button>
                <Button variant="secondary">Open list</Button>
                <Button variant="ghost">Learn more</Button>
                <Button variant="danger">Delete</Button>
              </div>
              <div className="ui-divider" />
              <div className="ui-kit-button-row">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large CTA</Button>
              </div>
              <div className="ui-divider" />
              <div className="ui-kit-button-row">
                <Button iconStart={<SparkIcon />}>Promote profile</Button>
                <Button variant="secondary" iconEnd={<ArrowIcon />}>
                  Open details
                </Button>
              </div>
            </Card>

            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">States</span>
                <h3 className="ui-type-h3">Hover, focus, active, loading and disabled</h3>
              </div>
              <div className="ui-kit-button-row">
                <Button hovered>Hover</Button>
                <Button focused>Focus</Button>
                <Button variant="secondary" active>
                  Selected
                </Button>
                <Button loading>Saving</Button>
                <Button disabled>Unavailable</Button>
              </div>
              <p className="ui-type-caption">These states are safe to reuse in any page shell.</p>
            </Card>
          </div>
        </section>

        <section className="ui-kit-section" id="forms">
          <SectionHeader
            eyebrow="Forms"
            title="Fields, helper text and validation states"
            description="Fields are composed as independent blocks with a predictable label / control / helper structure."
          />

          <div className="ui-kit-form-grid">
            <Card className="ui-kit-specimen">
              <div className="ui-kit-field-stack">
                <FormField label="Full name" hint="Default text field for profile and application flows." required>
                  <Input placeholder="Anna Kovaleva" />
                </FormField>
                <FormField label="Role" hint="Select keeps the same radius, hover and focus treatment.">
                  <Select options={roleOptions} defaultValue="candidate" />
                </FormField>
              </div>
            </Card>

            <Card className="ui-kit-specimen">
              <div className="ui-kit-field-stack">
                <FormField label="Focused field" hint="Static focus state for the showcase.">
                  <Input focused defaultValue="Product Analyst" />
                </FormField>
                <FormField label="Portfolio" hint="The link was validated successfully." success>
                  <Input type="url" defaultValue="https://portfolio.example" />
                </FormField>
              </div>
            </Card>

            <Card className="ui-kit-specimen">
              <div className="ui-kit-field-stack">
                <FormField label="Phone" error="The phone number is incomplete.">
                  <Input type="tel" defaultValue="+7 (900) 000-00-0_" />
                </FormField>
                <FormField label="About" hint="Textarea keeps long-form copy readable inside dense layouts.">
                  <Textarea placeholder="Tell us about your experience, interests and the next role you want to grow into." />
                </FormField>
              </div>
            </Card>

            <Card className="ui-kit-specimen">
              <div className="ui-kit-field-stack">
                <FormField label="Disabled field" hint="Disabled controls should not compete for attention." disabled>
                  <Input defaultValue="Editing is currently locked" disabled />
                </FormField>
              </div>
            </Card>

            <Card className="ui-kit-specimen ui-kit-specimen--full">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Field gallery</span>
                <h3 className="ui-type-h3">Search layouts and static control states from the Figma board</h3>
                <p className="ui-type-body">
                  The current frame includes plain search, icon-left and icon-right fields plus filled, hover, focus and disabled states. React now exposes those combinations without extra page CSS.
                </p>
              </div>

              <div className="ui-kit-field-gallery">
                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Search layouts</span>
                    <h3 className="ui-type-h3">Plain, icon left and icon right</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FieldState label="Plain">
                      <FormField label="Search opportunities">
                        <Input type="search" placeholder="Find openings" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Icon left">
                      <FormField label="Company">
                        <Input type="search" iconStart={<SearchIcon />} defaultValue="IT - Planeta" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Icon right">
                      <FormField label="Company">
                        <Input type="search" iconEnd={<SearchIcon />} defaultValue="IT - Planeta" />
                      </FormField>
                    </FieldState>
                  </div>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Input states</span>
                    <h3 className="ui-type-h3">Default, hover, focus, filled and disabled</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FieldState label="Default">
                      <FormField label="Role name">
                        <Input placeholder="Junior Product Analyst" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Hover">
                      <FormField label="Role name">
                        <Input hovered defaultValue="Junior Product Analyst" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Focus">
                      <FormField label="Role name">
                        <Input focused defaultValue="Junior Product Analyst" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Filled">
                      <FormField label="Role name">
                        <Input defaultValue="IT - Planeta" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Disabled">
                      <FormField label="Role name" disabled>
                        <Input defaultValue="Role is locked" disabled />
                      </FormField>
                    </FieldState>
                  </div>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Select states</span>
                    <h3 className="ui-type-h3">Default, placeholder, hover, focus and disabled</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FieldState label="Default">
                      <FormField label="Role">
                        <Select options={roleOptions} defaultValue="candidate" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Placeholder">
                      <FormField label="Role">
                        <Select options={roleOptions} placeholder="Choose role" defaultValue="" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Hover">
                      <FormField label="Role">
                        <Select hovered options={roleOptions} defaultValue="employer" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Focus">
                      <FormField label="Role">
                        <Select focused options={roleOptions} defaultValue="curator" />
                      </FormField>
                    </FieldState>
                    <FieldState label="Disabled">
                      <FormField label="Role" disabled>
                        <Select disabled options={roleOptions} defaultValue="candidate" />
                      </FormField>
                    </FieldState>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="ui-kit-specimen ui-kit-specimen--full">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Product patterns</span>
                <h3 className="ui-type-h3">Clear actions, secure fields and long-form input</h3>
                <p className="ui-type-body">
                  The base field layer now supports secondary label meta, header actions, inline copy, affixes, password reveal and textarea action rails for denser profile and application flows.
                </p>
              </div>

              <div className="ui-kit-field-gallery">
                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Input actions</span>
                    <h3 className="ui-type-h3">Clearable, copyable, prefixed, suffixed and resettable shells</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FormField label="Company lookup" hint="Clear action is built into the base Input shell.">
                      <Input
                        type="search"
                        value={companyFieldValue}
                        onValueChange={setCompanyFieldValue}
                        clearable
                        iconStart={<SearchIcon />}
                      />
                    </FormField>
                    <FormField
                      label="Public headline"
                      meta="Optional"
                      action={
                        <button
                          type="button"
                          className="ui-field__action-button"
                          onClick={() => {
                            setHeadlineValue(publicHeadlinePreset);
                          }}
                        >
                          Autofill
                        </button>
                      }
                      hint="Label-side actions can populate common values without page-level wrappers."
                    >
                      <Input
                        value={headlineValue}
                        onValueChange={setHeadlineValue}
                        clearable
                        placeholder={publicHeadlinePreset}
                      />
                    </FormField>
                    <FormField
                      label="Portfolio URL"
                      meta="Clear + end icon"
                      hint="The shell can keep an end icon even when the clear affordance is visible."
                    >
                      <Input type="url" defaultValue="https://portfolio.example" clearable iconEnd={<SparkIcon />} />
                    </FormField>
                    <FormField label="Telegram handle" meta="Prefix" hint="Short identity tokens can live inside the control instead of external helper markup.">
                      <Input addonStart="@" defaultValue="kolyamix" />
                    </FormField>
                    <FormField label="Salary target" meta="Suffix" hint="Units and currencies stay attached to the entered value through the same shell API.">
                      <Input inputMode="numeric" defaultValue="180000" addonEnd="₽" />
                    </FormField>
                    <FormField
                      label="Invite link"
                      meta="Copy"
                      hint="Readonly values can expose inline copy without extra buttons outside the control shell."
                    >
                      <Input
                        readOnly
                        defaultValue="https://tramplin.example/invite/curator-2026"
                        copyable
                      />
                    </FormField>
                    <FormField
                      label="Desired role"
                      meta="Optional"
                      hint="Native Select now supports placeholder and inline reset without extra page-level actions."
                    >
                      <Select
                        value={desiredRoleValue}
                        onValueChange={setDesiredRoleValue}
                        options={roleOptions}
                        placeholder="Choose role"
                        clearable
                        iconStart={<PanelIcon />}
                      />
                    </FormField>
                  </div>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Secure access</span>
                    <h3 className="ui-type-h3">Password reveal without page-level wrappers</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FormField
                      label="Workspace password"
                      hint="Reveal toggle lives in the base Input component instead of custom page glue."
                    >
                      <Input type="password" defaultValue="CareerFlow-2026" revealable autoComplete="current-password" />
                    </FormField>
                    <FormField
                      label="One-time passcode"
                      meta="6 digits"
                      hint="Short hidden values can reuse the same pattern in auth, recovery and invite flows."
                    >
                      <Input
                        type="password"
                        inputMode="numeric"
                        defaultValue="847362"
                        revealable
                        autoComplete="one-time-code"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Textarea patterns</span>
                    <h3 className="ui-type-h3">Auto height, action rail and long-form cleanup</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FormField
                      label="Short bio"
                      hint="Textarea can auto-grow while its own rail exposes live count plus copy and clear actions."
                    >
                      <Textarea
                        autoResize
                        maxLength={180}
                        value={bioValue}
                        onValueChange={setBioValue}
                        showCount
                        copyable
                        clearable
                        placeholder="Describe the kind of product work you want to keep doing."
                      />
                    </FormField>
                    <FormField
                      label="Interview recap template"
                      meta="Copy"
                      hint="Readonly long-form copy can stay inside the control and still expose inline copy for operators."
                    >
                      <Textarea
                        autoResize
                        readOnly
                        copyable
                        defaultValue={`Thanks for taking the time to speak with the team today.\n\nWe are consolidating interview notes and will share the next step by Friday.`}
                      />
                    </FormField>
                    <FormField label="Motivation note" hint="Auto height works for multiline content without manual drag resizing.">
                      <Textarea
                        autoResize
                        defaultValue={`I like building clear systems for hiring teams.\n\nThe strongest workflows are the ones candidates barely notice, because every step already makes sense.`}
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="ui-kit-section" id="selection">
          <SectionHeader
            eyebrow="Selection"
            title="Checkbox, radio and switch controls"
            description="Selection atoms are detached from legacy shared CSS, and ChoiceGroup now lets them travel as accessible fieldset blocks into onboarding, filters and privacy settings."
          />

          <div className="ui-kit-selection-grid">
            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Checkbox</span>
                <h3 className="ui-type-h3">Agreements and multiple choice</h3>
              </div>
              <ChoiceGroup legend="Digest channels" hint="Several preferences can stay active at the same time.">
                <Checkbox defaultChecked label="Receive career recommendations" hint="Weekly suggestions for vacancies and events." />
                <Checkbox label="Show salary expectations" hint="Visible only to signed-in employers." />
              </ChoiceGroup>
            </Card>

            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Radio</span>
                <h3 className="ui-type-h3">A single active scenario</h3>
              </div>
              <ChoiceGroup legend="Profile visibility" hint="One option defines how your resume appears in search." required>
                <Radio name="privacy" defaultChecked label="Open profile" hint="Resume is visible to employers and curators." />
                <Radio name="privacy" label="Invite only" hint="Contacts stay hidden until an application or invitation happens." />
              </ChoiceGroup>
            </Card>

            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Switch</span>
                <h3 className="ui-type-h3">Fast binary toggle</h3>
              </div>
              <ChoiceGroup legend="Availability signals" hint="Each switch works independently inside the same preference block.">
                <Switch defaultChecked label="Public status" hint="Show that you are open to new offers." />
                <Switch label="Quiet mode" hint="Mute notifications for the current session." />
              </ChoiceGroup>
            </Card>

            <Card className="ui-kit-specimen ui-kit-specimen--full">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Selection gallery</span>
                <h3 className="ui-type-h3">Static control states aligned with the kit board</h3>
                <p className="ui-type-body">
                  The selection set now exposes hover and focus previews through component props, and Checkbox also supports an indeterminate state for tree views and bulk actions.
                </p>
              </div>

              <div className="ui-kit-field-gallery">
                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Checkbox</span>
                    <h3 className="ui-type-h3">Default, hover, checked, indeterminate, disabled</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FieldState label="Default">
                      <Checkbox label="Include archived opportunities" hint="Unchecked baseline for filter panels." />
                    </FieldState>
                    <FieldState label="Hover">
                      <Checkbox hovered label="Include archived opportunities" hint="Static hover preview for the kit." />
                    </FieldState>
                    <FieldState label="Checked">
                      <Checkbox defaultChecked label="Include archived opportunities" hint="Selected state for active filters." />
                    </FieldState>
                    <FieldState label="Indeterminate">
                      <Checkbox indeterminate label="Select team members" hint="Useful when only part of a nested group is selected." />
                    </FieldState>
                    <FieldState label="Disabled">
                      <Checkbox disabled defaultChecked label="Include archived opportunities" hint="Locked by organization policy." />
                    </FieldState>
                  </div>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Radio</span>
                    <h3 className="ui-type-h3">Default, hover, checked, focus, disabled</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FieldState label="Default">
                      <Radio name="radio-default" label="Open profile" hint="Base state for single-choice flows." />
                    </FieldState>
                    <FieldState label="Hover">
                      <Radio hovered name="radio-hover" label="Open profile" hint="Preview of the hovered control shell." />
                    </FieldState>
                    <FieldState label="Checked">
                      <Radio defaultChecked name="radio-checked" label="Open profile" hint="Current active privacy mode." />
                    </FieldState>
                    <FieldState label="Focus">
                      <Radio focused name="radio-focus" label="Open profile" hint="Static focus ring for accessibility review." />
                    </FieldState>
                    <FieldState label="Disabled">
                      <Radio disabled name="radio-disabled" label="Open profile" hint="Unavailable while moderation is in progress." />
                    </FieldState>
                  </div>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Switch</span>
                    <h3 className="ui-type-h3">Off, hover, on, focus, disabled</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FieldState label="Off">
                      <Switch label="Quiet mode" hint="Default off state for binary settings." />
                    </FieldState>
                    <FieldState label="Hover">
                      <Switch hovered label="Quiet mode" hint="Raised preview on pointer hover." />
                    </FieldState>
                    <FieldState label="On">
                      <Switch defaultChecked label="Quiet mode" hint="Enabled state for active notifications rule." />
                    </FieldState>
                    <FieldState label="Focus">
                      <Switch focused defaultChecked label="Quiet mode" hint="Focus ring preview for keyboard navigation." />
                    </FieldState>
                    <FieldState label="Disabled">
                      <Switch disabled label="Quiet mode" hint="Locked by current workspace permissions." />
                    </FieldState>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="ui-kit-specimen ui-kit-specimen--full">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Grouped flows</span>
                <h3 className="ui-type-h3">Fieldset semantics for real settings forms</h3>
                <p className="ui-type-body">
                  ChoiceGroup adds legend-side meta, actions, message text and group-level semantics, so selection controls can be dropped into actual forms without custom wrappers.
                </p>
              </div>

              <div className="ui-kit-field-gallery">
                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Required</span>
                    <h3 className="ui-type-h3">Single-choice privacy block</h3>
                  </div>
                  <ChoiceGroup
                    legend="Who can contact you"
                    hint="Choose exactly one visibility mode for the current profile."
                    required
                  >
                    <Radio name="grouped-privacy" defaultChecked label="Public in search" hint="Recruiters can discover your profile from shared listings." />
                    <Radio name="grouped-privacy" label="Invite only" hint="Contacts stay hidden until you approve a conversation." />
                  </ChoiceGroup>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Error</span>
                    <h3 className="ui-type-h3">Multi-select validation</h3>
                  </div>
                  <ChoiceGroup
                    legend="Notification channels"
                    error="Select at least one channel before digest delivery can be enabled."
                  >
                    <Checkbox label="Email digest" hint="Weekly summary of matched roles and employer activity." />
                    <Checkbox label="Telegram bot" hint="Instant delivery for shortlist updates and interview invites." />
                    <Checkbox label="SMS alerts" hint="Critical reminders only, such as interview reschedules." />
                  </ChoiceGroup>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Horizontal / success</span>
                    <h3 className="ui-type-h3">Compact toggle row</h3>
                  </div>
                  <ChoiceGroup
                    legend="Availability badges"
                    hint="Current status signals are already synced with your public profile."
                    success
                    orientation="horizontal"
                  >
                    <Switch defaultChecked label="Open to offers" hint="Visible on vacancy cards." />
                    <Switch defaultChecked label="Remote only" hint="Shown in search filters." />
                  </ChoiceGroup>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Action / meta</span>
                    <h3 className="ui-type-h3">Bulk selection with legend-side controls</h3>
                  </div>
                  <ChoiceGroup
                    legend="Digest delivery"
                    meta={`${selectedNotificationCount}/3 selected`}
                    action={
                      <button
                        type="button"
                        className="ui-choice-group__action-button"
                        onClick={() => {
                          setNotificationSelection((currentSelection) => {
                            const shouldSelectAll = !notificationChannelKeys.every((key) => currentSelection[key]);

                            return notificationChannelKeys.reduce(
                              (nextSelection, key) => ({ ...nextSelection, [key]: shouldSelectAll }),
                              {}
                            );
                          });
                        }}
                      >
                        {allNotificationsSelected ? "Clear all" : "Select all"}
                      </button>
                    }
                    error={selectedNotificationCount === 0 ? "Select at least one route before digest delivery can be enabled." : undefined}
                    hint={selectedNotificationCount > 0 ? "Header actions can drive grouped checkbox flows without extra page-specific wrappers." : undefined}
                  >
                    <Checkbox
                      checked={notificationSelection.email}
                      onChange={(event) => {
                        setNotificationSelection((currentSelection) => ({
                          ...currentSelection,
                          email: event.target.checked,
                        }));
                      }}
                      label="Email digest"
                      hint="Weekly round-up of matches and shortlist changes."
                    />
                    <Checkbox
                      checked={notificationSelection.telegram}
                      onChange={(event) => {
                        setNotificationSelection((currentSelection) => ({
                          ...currentSelection,
                          telegram: event.target.checked,
                        }));
                      }}
                      label="Telegram bot"
                      hint="Instant alerts for interviews, messages and shortlist moves."
                    />
                    <Checkbox
                      checked={notificationSelection.sms}
                      onChange={(event) => {
                        setNotificationSelection((currentSelection) => ({
                          ...currentSelection,
                          sms: event.target.checked,
                        }));
                      }}
                      label="SMS alerts"
                      hint="Critical reminders only, such as reschedules and expired invites."
                    />
                  </ChoiceGroup>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="ui-kit-section" id="status">
          <SectionHeader
            eyebrow="Status"
            title="Chips, tags, badges and alerts"
            description="These elements provide compact interface-level feedback for filters, content states and short system messages."
          />

          <div className="ui-kit-grid ui-kit-grid--two">
            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Inline labels</span>
                <h3 className="ui-type-h3">Chips, tags and badges</h3>
              </div>
              <div className="ui-kit-chip-row">
                <Badge kind="chip">Internship</Badge>
                <Badge kind="chip" active>
                  Junior
                </Badge>
                <Badge kind="chip" tone="accent">
                  Hybrid
                </Badge>
              </div>
              <div className="ui-kit-chip-row">
                <Badge kind="tag">New</Badge>
                <Badge kind="tag" tone="success">
                  Confirmed
                </Badge>
                <Badge kind="tag" tone="warning">
                  Needs review
                </Badge>
                <Badge kind="tag" tone="danger">
                  Error
                </Badge>
              </div>
              <div className="ui-kit-badge-row">
                <Badge>Draft</Badge>
                <Badge tone="success">Published</Badge>
                <Badge tone="warning">Moderation</Badge>
                <Badge tone="danger">Rejected</Badge>
              </div>
            </Card>

            <Card className="ui-kit-specimen">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Feedback</span>
                <h3 className="ui-type-h3">Alert states</h3>
              </div>
              <div className="ui-kit-alert-stack">
                <Alert title="Profile is almost ready">Add portfolio links and a target role to improve recommendations.</Alert>
                <Alert tone="success" title="Changes saved">
                  Updated profile data is already visible in product flows.
                </Alert>
                <Alert tone="warning" title="Review needed">
                  The Telegram link was added without a public username.
                </Alert>
                <Alert tone="error" title="Validation error">
                  The form cannot be submitted until all required fields are filled in.
                </Alert>
              </div>
            </Card>

            <Card className="ui-kit-specimen ui-kit-specimen--full">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-specimen__eyebrow">Status gallery</span>
                <h3 className="ui-type-h3">Icon-led labels and richer alert structures</h3>
                <p className="ui-type-body">
                  Status primitives now support icon and dot compositions, while alerts can expose semantic icons, inline actions and dismiss affordances without page-level wrappers.
                </p>
              </div>

              <div className="ui-kit-field-gallery">
                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Badges</span>
                    <h3 className="ui-type-h3">Dot, icon and directional variants</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <FieldState label="Signal chips">
                      <div className="ui-kit-chip-row">
                        <Badge kind="chip" dot>
                          Live search
                        </Badge>
                        <Badge kind="chip" tone="accent" iconStart={<SparkIcon />}>
                          Featured
                        </Badge>
                        <Badge kind="chip" active iconEnd={<ArrowIcon />}>
                          Open roles
                        </Badge>
                      </div>
                    </FieldState>
                    <FieldState label="Tags">
                      <div className="ui-kit-chip-row">
                        <Badge kind="tag" iconStart={<SparkIcon />}>
                          New
                        </Badge>
                        <Badge kind="tag" tone="success" dot>
                          Approved
                        </Badge>
                        <Badge kind="tag" tone="warning" iconEnd={<ArrowIcon />}>
                          Review queue
                        </Badge>
                      </div>
                    </FieldState>
                    <FieldState label="Badges">
                      <div className="ui-kit-badge-row">
                        <Badge dot>Monitoring</Badge>
                        <Badge tone="success" iconStart={<SparkIcon />}>
                          Published 12
                        </Badge>
                        <Badge tone="danger" iconEnd={<ArrowIcon />}>
                          Action needed
                        </Badge>
                      </div>
                    </FieldState>
                  </div>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__copy">
                    <span className="ui-kit-specimen__eyebrow">Alerts</span>
                    <h3 className="ui-type-h3">Icons, body copy and inline actions</h3>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    <Alert showIcon title="Access request is pending">
                      A curator needs to confirm your workspace invitation before candidate profiles become visible.
                    </Alert>
                    <Alert
                      tone="success"
                      showIcon
                      title="Weekly digest is active"
                      actions={
                        <>
                          <Button size="sm" variant="secondary">
                            Configure
                          </Button>
                          <Button size="sm">View digest</Button>
                        </>
                      }
                    >
                      Notification summaries will be sent every Monday at 09:00 Moscow time.
                    </Alert>
                    <Alert tone="warning" showIcon title="Profile import found conflicts">
                      Duplicate phone numbers were merged into one candidate card. Review the imported records before publishing.
                    </Alert>
                  </div>
                </div>

                <div className="ui-surface ui-kit-field-panel">
                  <div className="ui-kit-specimen__head">
                    <div className="ui-kit-specimen__copy">
                      <span className="ui-kit-specimen__eyebrow">Dismissible</span>
                      <h3 className="ui-type-h3">Live close actions</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setDismissedAlerts({})}>
                      Reset
                    </Button>
                  </div>
                  <div className="ui-kit-field-panel__stack">
                    {!dismissedAlerts.sync ? (
                      <Alert
                        tone="info"
                        showIcon
                        title="Sync is still running"
                        onDismiss={() => setDismissedAlerts((current) => ({ ...current, sync: true }))}
                      >
                        Vacancies from the employer dashboard are still being normalized in the background.
                      </Alert>
                    ) : (
                      <p className="ui-type-caption">Sync alert dismissed. Use Reset to show it again.</p>
                    )}
                    {!dismissedAlerts.error ? (
                      <Alert
                        tone="error"
                        showIcon
                        title="2 records need attention"
                        onDismiss={() => setDismissedAlerts((current) => ({ ...current, error: true }))}
                        actions={
                          <Button size="sm" variant="secondary">
                            Open review
                          </Button>
                        }
                      >
                        Resume parsing failed for two imported files because required contact fields were missing.
                      </Alert>
                    ) : (
                      <p className="ui-type-caption">Error alert dismissed. Use Reset to restore the example.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="ui-kit-section" id="utilities">
          <SectionHeader
            eyebrow="Utilities"
            title="Search, avatars, tabs, loader and modal shell"
            description="These higher-level pieces help product screens compose identity, navigation and empty flows without one-off styling."
          />

          <div className="ui-kit-grid ui-kit-grid--two">
            <Card className="ui-kit-specimen">
              <SectionHeader
                compact
                eyebrow="Identity"
                title="SearchInput and Avatar"
                description="Useful for sidebars, headers and assignment flows."
              />
              <SearchInput
                value={searchValue}
                placeholder="Search components"
                onChange={(event) => setSearchValue(event.target.value)}
                onClear={() => setSearchValue("")}
              />
              <div className="ui-kit-avatar-row">
                <div className="ui-kit-avatar-stack">
                  <Avatar name="Anna Smith" status="online" />
                  <div>
                    <p className="ui-type-body">Anna Smith</p>
                    <p className="ui-type-caption">Curator · online</p>
                  </div>
                </div>
                <div className="ui-kit-avatar-stack">
                  <Avatar name="Ivan Petrov" status="away" />
                  <div>
                    <p className="ui-type-body">Ivan Petrov</p>
                    <p className="ui-type-caption">Employer · away</p>
                  </div>
                </div>
                <div className="ui-kit-avatar-stack">
                  <Avatar name="QA" size="lg" status="busy" />
                  <div>
                    <p className="ui-type-body">QA reviewer</p>
                    <p className="ui-type-caption">Busy · large variant</p>
                  </div>
                </div>
              </div>
              <div className="ui-divider" />
              <div className="ui-kit-avatar-grid">
                <div className="ui-kit-avatar-card">
                  <Avatar name="Talent Review" initials="TR" tone="accent" status="online" />
                  <div>
                    <p className="ui-type-body">Primary circle</p>
                    <p className="ui-type-caption">Accent tone · online state</p>
                  </div>
                </div>
                <div className="ui-kit-avatar-card">
                  <Avatar name="Knowledge Sync" initials="KS" shape="rounded" tone="neutral" status="away" />
                  <div>
                    <p className="ui-type-body">Rounded neutral</p>
                    <p className="ui-type-caption">For denser dashboard rows</p>
                  </div>
                </div>
                <div className="ui-kit-avatar-card">
                  <Avatar name="Quality Assurance" initials="QA" tone="success" status="online" />
                  <div>
                    <p className="ui-type-body">Success tone</p>
                    <p className="ui-type-caption">Positive identity highlight</p>
                  </div>
                </div>
                <div className="ui-kit-avatar-card">
                  <Avatar name="Archive Review" initials="AR" size="lg" shape="rounded" tone="warning" status="busy" />
                  <div>
                    <p className="ui-type-body">Large warning</p>
                    <p className="ui-type-caption">Priority reviewer presence</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="ui-kit-specimen">
              <SectionHeader
                compact
                eyebrow="Navigation"
                title="Tabs and section headers"
                description="A compact way to segment related content inside cards or panels."
              />
              <div className="ui-kit-tabs-stack">
                <Tabs items={tabItems} stretch />
                <Tabs items={verticalTabItems} orientation="vertical" />
              </div>
            </Card>

            <Card className="ui-kit-specimen ui-kit-specimen--full">
              <SectionHeader
                compact
                eyebrow="Empty flows"
                title="EmptyState, Loader and Modal"
                description="Three utility pieces commonly used together in async product scenarios, plus modal presets for attention, confirmation and review flows."
                actions={
                  <div className="ui-kit-modal-trigger-row">
                    <Button size="sm" onClick={() => setModalState({ open: true, preset: "default" })}>
                      Default modal
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setModalState({ open: true, preset: "success" })}>
                      Success modal
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setModalState({ open: true, preset: "warning" })}>
                      Warning modal
                    </Button>
                  </div>
                }
              />
              <div className="ui-kit-utility-grid">
                <EmptyState
                  tone="neutral"
                  align="center"
                  eyebrow="No results"
                  title="Nothing matches the current filters"
                  description="Try broadening role, city or format so the recommendation feed can show more opportunities."
                  icon={<span className="ui-kit-empty-orb" />}
                  actions={
                    <>
                      <Button size="sm">Reset filters</Button>
                      <Button variant="secondary" size="sm">
                        Save search
                      </Button>
                    </>
                  }
                />
                <div className="ui-kit-loader-card">
                  <Loader surface tone="neutral" label="Refreshing suggestions" />
                  <p className="ui-type-caption">Use inline or centered variants inside cards and panels.</p>
                  <ul className="ui-kit-preset-list">
                    <li>
                      <span>Modal tone</span>
                      <code>{activeModalPreset.tone}</code>
                    </li>
                    <li>
                      <span>Modal size</span>
                      <code>{activeModalPreset.size}</code>
                    </li>
                    <li>
                      <span>Icon slot</span>
                      <code>{String(activeModalPreset.showIcon)}</code>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="ui-kit-section" id="cards">
          <SectionHeader
            eyebrow="Cards"
            title="Composition layer examples"
            description="These cards show how the atoms assemble into meaningful product blocks."
            meta={<Badge dot>Composition APIs</Badge>}
          />

          <Card className="ui-kit-specimen ui-kit-specimen--full" tone="neutral">
            <SectionHeader
              eyebrow="Structure"
              title="Card and section header variants"
              description="Cards now expose tone, selected and action-surface states, while section headers can switch size, alignment and divider treatment without custom wrappers."
              size="md"
              divider
              actions={<Badge kind="tag" tone="success">Primitive level</Badge>}
            />

            <div className="ui-kit-composition-grid">
              <Card compact tone="accent" selected>
                <SectionHeader
                  eyebrow="Selected"
                  title="Focused summary card"
                  description="Accent tone with selected emphasis works for active dashboards, opened drawers and current workspace context."
                  size="sm"
                  actions={<Badge dot>Live</Badge>}
                />
                <p className="ui-type-body">This pattern is useful for whichever block currently owns user attention inside a dense product surface.</p>
              </Card>

              <Card compact tone="success">
                <SectionHeader
                  eyebrow="Centered"
                  title="Balanced message block"
                  description="Centered small headers work well for outcome-driven panels and post-action confirmations."
                  size="sm"
                  align="center"
                />
                <EmptyState
                  compact
                  tone="success"
                  align="center"
                  eyebrow="Completed"
                  title="Digest has been scheduled"
                  description="This uses the composition primitives directly, without custom page CSS for the card shell."
                  icon={<span className="ui-kit-empty-orb" />}
                />
              </Card>
            </div>

            <div className="ui-divider" />

            <SectionHeader
              compact
              eyebrow="Interaction"
              title="Anchor, button and disabled card shells"
              description="The card primitive can now render as a real link or button, while the demo still exposes static hover and focus states for showcase parity."
              actions={<Badge kind="tag">as / href / disabled</Badge>}
            />

            <div className="ui-kit-card-state-grid">
              <FieldState label="Anchor / hover">
                <Card as="a" href="#buttons" tone="accent" hovered className="ui-kit-card-sample ui-kit-card-state-sample">
                  <div className="ui-kit-card-sample__copy">
                    <Badge kind="tag">Anchor</Badge>
                    <h3 className="ui-type-h3">Jump to button states</h3>
                    <p className="ui-type-body">Use anchor cards for vacancy lists, result feeds and drill-down dashboards where the whole surface is a destination.</p>
                  </div>
                  <div className="ui-kit-status-strip">
                    <Badge kind="chip" tone="accent" active iconEnd={<ArrowIcon />}>
                      Open section
                    </Badge>
                    <Badge dot>Hover preview</Badge>
                  </div>
                </Card>
              </FieldState>

              <FieldState label="Button / focus">
                <Card as="button" type="button" tone="neutral" selected focused className="ui-kit-card-sample ui-kit-card-state-sample">
                  <div className="ui-kit-card-sample__copy">
                    <Badge kind="tag" tone="success">
                      Button
                    </Badge>
                    <h3 className="ui-type-h3">Focusable selection card</h3>
                    <p className="ui-type-body">Button cards fit filter pickers, workspace switching and dense chooser panels where keyboard focus must stay visible.</p>
                  </div>
                  <div className="ui-kit-status-strip">
                    <Badge kind="chip" active>
                      Selected
                    </Badge>
                    <Badge dot tone="success">Focus ring</Badge>
                  </div>
                </Card>
              </FieldState>

              <FieldState label="Disabled">
                <Card as="button" type="button" tone="warning" disabled className="ui-kit-card-sample ui-kit-card-state-sample">
                  <div className="ui-kit-card-sample__copy">
                    <Badge kind="tag" tone="warning">
                      Disabled
                    </Badge>
                    <h3 className="ui-type-h3">Unavailable action surface</h3>
                    <p className="ui-type-body">Disabled cards keep layout and messaging intact while suppressing hover, focus and accidental activation.</p>
                  </div>
                  <div className="ui-kit-status-strip">
                    <Badge tone="warning">Locked</Badge>
                    <Badge kind="chip">Awaiting access</Badge>
                  </div>
                </Card>
              </FieldState>
            </div>
          </Card>

          <div className="ui-kit-card-grid">
            <Card interactive hovered tone="accent" selected className="ui-kit-card-sample">
              <div className="ui-kit-card-sample__copy">
                <Badge kind="tag">Vacancy</Badge>
                <h3 className="ui-type-h3">Junior Product Analyst</h3>
                <p className="ui-type-body">Analytics, SQL and BI work inside a hybrid team with a strong onboarding system.</p>
              </div>
              <div className="ui-kit-status-strip">
                <Badge tone="success">Open</Badge>
                <Badge kind="chip">Moscow</Badge>
                <Badge kind="chip">Hybrid</Badge>
              </div>
              <div className="ui-divider" />
              <div className="ui-kit-inline-row">
                <Button size="sm">Apply</Button>
                <Button variant="secondary" size="sm">
                  Save
                </Button>
              </div>
            </Card>

            <Card tone="success" className="ui-kit-card-sample">
              <div className="ui-kit-card-sample__copy">
                <Badge kind="tag" tone="success">
                  Metric
                </Badge>
                <div className="ui-kit-card-metric">
                  <strong>84%</strong>
                  <p className="ui-type-body">Profile-to-role match after skills and experience were refreshed.</p>
                </div>
              </div>
              <div className="ui-kit-card-sample__meta">
                <Badge>SQL</Badge>
                <Badge>Research</Badge>
                <Badge>Dashboard</Badge>
              </div>
            </Card>

            <Card tone="warning" className="ui-kit-card-sample">
              <div className="ui-kit-card-sample__copy">
                <Badge kind="tag" tone="warning">
                  Note
                </Badge>
                <h3 className="ui-type-h3">How to use this layer</h3>
                <p className="ui-type-body">
                  Import shared tokens and React atoms, then compose pages with these pieces instead of hand-rolling page-level CSS.
                </p>
              </div>
              <ul className="ui-kit-list">
                <li>
                  <span>Foundation</span>
                  <code>tokens.css</code>
                </li>
                <li>
                  <span>UI styles</span>
                  <code>index.css</code>
                </li>
                <li>
                  <span>Showcase shell</span>
                  <code>ui-kit.css</code>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        <footer className="ui-surface ui-kit-footer">
          <p className="ui-type-body">
            Next pass after this one: a deeper parity check against the Figma frame once direct MCP access is available again, without changing the `ui-*` contracts introduced here.
          </p>
        </footer>
      </main>

      <Modal
        open={modalState.open}
        onClose={() => setModalState((current) => ({ ...current, open: false }))}
        tone={activeModalPreset.tone}
        size={activeModalPreset.size}
        showIcon={activeModalPreset.showIcon}
        initialFocusRef={primaryModalActionRef}
        title={activeModalPreset.title}
        description={activeModalPreset.description}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalState((current) => ({ ...current, open: false }))}>
              {activeModalPreset.cancelLabel}
            </Button>
            <Button ref={primaryModalActionRef} size="sm" onClick={() => setModalState((current) => ({ ...current, open: false }))}>
              {activeModalPreset.confirmLabel}
            </Button>
          </>
        }
      >
        <p>{activeModalPreset.body}</p>
      </Modal>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UiKitDemo />
  </React.StrictMode>
);
