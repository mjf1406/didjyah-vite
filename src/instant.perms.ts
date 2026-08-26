// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const sharedOwnerBinds = [
  "isAuthenticated",
  "auth.id != null",
  "isOwner",
  "auth.id in data.ref('owner.id')",
  "isGuestOwner",
  "data.ref('owner.id').exists(o, o in auth.ref('$user.linkedGuestUsers.id'))",
  "isLinkedPrimaryOwner",
  "auth.ref('$user.linkedPrimaryUser.id').exists(p, p in data.ref('owner.id'))",
  "canAccess",
  "isOwner || isGuestOwner || isLinkedPrimaryOwner",
  "isPremium",
  "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
] as const;

const rules = {
  attrs: {
    allow: {
      $default: "false",
    },
  },
  todos: {
    bind: [...sharedOwnerBinds],
    allow: {
      view: "canAccess",
      create:
        "isAuthenticated && auth.id in data.ref('owner.id') && (size(data.ref('owner.ownerTodos.id')) < 6 || isPremium)",
      delete: "canAccess",
      update: "canAccess",
    },
  },
  $files: {
    bind: [
      "isAuthenticated",
      "auth.id != null",
      "isCreator",
      "auth.id != null && auth.id == data.creatorId",
      "isStillCreator",
      "auth.id != null && auth.id == newData.creatorId",
      "isOwner",
      "auth.id != null && auth.id == data.id",
      "isStillOwner",
      "auth.id != null && auth.id == newData.id",
      "isPremium",
      "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
    ],
    allow: {
      view: "isAuthenticated",
      create: "isAuthenticated",
      delete: "isAuthenticated",
      update: "isAuthenticated",
    },
  },
  $users: {
    bind: [
      "isAuthenticated",
      "auth.id != null",
      "isCreator",
      "auth.id != null && auth.id == data.creatorId",
      "isStillCreator",
      "auth.id != null && auth.id == newData.creatorId",
      "isOwner",
      "auth.id != null && auth.id == data.id",
      "isStillOwner",
      "auth.id != null && auth.id == newData.id",
      "isPremium",
      "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
    ],
    allow: {
      view: "isOwner",
      create: "false",
      delete: "false",
      update: "false",
    },
  },
  didjyahs: {
    bind: [...sharedOwnerBinds],
    allow: {
      view: "canAccess",
      create:
        "isAuthenticated && auth.id in data.ref('owner.id') && (size(data.ref('owner.didjyahs.id')) < 6 || isPremium)",
      delete: "canAccess",
      update: "canAccess",
    },
  },
  didjyahFolders: {
    bind: [...sharedOwnerBinds],
    allow: {
      view: "canAccess",
      create: "isAuthenticated && auth.id in data.ref('owner.id')",
      delete: "canAccess",
      update: "canAccess",
    },
  },
  profiles: {
    bind: [
      "isAuthenticated",
      "auth.id != null",
      "isOwner",
      "auth.id in data.ref('user.id')",
      "isStillOwner",
      "auth.id in newData.ref('user.id')",
      "isPremium",
      "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
    ],
    allow: {
      view: "isOwner",
      create: "isAuthenticated && auth.id in data.ref('user.id')",
      delete: "isOwner",
      update: "isOwner",
    },
  },
  didjyahRecords: {
    bind: [...sharedOwnerBinds],
    allow: {
      view: "canAccess",
      create: "isAuthenticated && auth.id in data.ref('owner.id')",
      delete: "canAccess",
      update: "canAccess",
    },
  },
} satisfies InstantRules;

export default rules;
