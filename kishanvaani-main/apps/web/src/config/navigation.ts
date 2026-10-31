export interface NavigationItem {
  label: string;
  path: string;
  children?: NavigationItem[];
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    path: "/",
  },

  {
    label: "Mandi Prices",
    path: "/mandi-prices",
  },

  {
    label: "Agriculture",
    path: "/agriculture",
    children: [
      {
        label: "News",
        path: "/agriculture/news",
      },
      {
        label: "Weather",
        path: "/agriculture/weather",
      },
      {
        label: "Live Statewide Weather",
        path: "/weather",
      },
      {
        label: "Mandi Prices",
        path: "/agriculture/mandi-prices",
      },
      {
        label: "Crop Advisory",
        path: "/agriculture/crop-advisory",
      },
      {
        label: "Livestock",
        path: "/agriculture/livestock",
      },
      {
        label: "Government Schemes",
        path: "/agriculture/government-schemes",
      },
    ],
  },

  {
    label: "Community",
    path: "/community",
    children: [
      {
        label: "Success Stories",
        path: "/community/success-stories",
      },
      {
        label: "Learning from Failure",
        path: "/community/learning-from-failure",
      },
      {
        label: "Farmer Experiences",
        path: "/community/farmer-experiences",
      },
      {
        label: "Ask an Expert",
        path: "/community/ask-an-expert",
      },
    ],
  },

  {
    label: "Literature",
    path: "/literature",
    children: [
      {
        label: "Stories",
        path: "/literature/stories",
      },
      {
        label: "Poems",
        path: "/literature/poems",
      },
      {
        label: "Folk Tales",
        path: "/literature/folk-tales",
      },
      {
        label: "Audio Books",
        path: "/literature/audio-books",
      },
    ],
  },

  {
    label: "Audio Library",
    path: "/audio",
  },

  {
    label: "Upload",
    path: "/upload",
  },

  {
    label: "Search",
    path: "/search",
  },

  {
    label: "Profile",
    path: "/profile",
  },
];