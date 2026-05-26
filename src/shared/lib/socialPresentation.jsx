import {
  TelegramIcon,
  GlobeIcon,
  VkIcon,
  YoutubeIcon,
  GithubIcon,
  LinkIcon,
} from "../ui";

export function resolveSocialType(label, url) {
  const normLabel = String(label ?? "").trim().toLowerCase();
  const normUrl = String(url ?? "").trim().toLowerCase();

  if (normLabel === "telegram" || normLabel === "tg" || normUrl.includes("t.me/")) {
    return "telegram";
  }
  if (normLabel === "vk" || normLabel === "vkontakte" || normUrl.includes("vk.com/")) {
    return "vk";
  }
  if (normLabel === "youtube" || normLabel === "yt" || normUrl.includes("youtube.com/") || normUrl.includes("youtu.be/")) {
    return "youtube";
  }
  if (normLabel === "github" || normUrl.includes("github.com/")) {
    return "github";
  }
  if (normLabel === "website" || normLabel === "site" || normLabel === "web" || normUrl.startsWith("http")) {
    return "website";
  }
  return "link";
}

export function getSocialIcon(type) {
  switch (type) {
    case "telegram":
      return <TelegramIcon />;
    case "vk":
      return <VkIcon />;
    case "youtube":
      return <YoutubeIcon />;
    case "github":
      return <GithubIcon />;
    case "website":
      return <GlobeIcon />;
    default:
      return <LinkIcon />;
  }
}

export function getSocialLabel(type) {
  switch (type) {
    case "telegram":
      return "Telegram";
    case "vk":
      return "ВКонтакте";
    case "youtube":
      return "YouTube";
    case "github":
      return "GitHub";
    case "website":
      return "Веб-сайт";
    default:
      return "Ссылка";
  }
}
