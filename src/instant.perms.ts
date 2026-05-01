// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  attrs: {
    allow: {
      $default: "false",
    },
  },
  todos: {
    bind: [
      "isAuthenticated",
      "auth.id != null",
      "isOwner",
      "data.owner == auth.id",
      "isGuestOwner",
      "data.owner in auth.ref('$user.linkedGuestUsers.id')",
      "isPremium",
      "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
    ],
    allow: {
      view: "isOwner || isGuestOwner",
      create:
        "isAuthenticated && (size(data.ref('owner.ownerTodos.id')) < 6 || isPremium)",
      delete: "isOwner || isGuestOwner",
      update: "isOwner || isGuestOwner",
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
    bind: [
      "isAuthenticated",
      "auth.id != null",
      "isOwner",
      "data.owner == auth.id",
      "isGuestOwner",
      "data.owner in auth.ref('$user.linkedGuestUsers.id')",
      "isPremium",
      "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
    ],
    allow: {
      view: "isOwner || isGuestOwner",
      create:
        "isAuthenticated && (size(data.ref('owner.didjyahs.id')) < 6 || isPremium)",
      delete: "isOwner || isGuestOwner",
      update: "isOwner || isGuestOwner",
    },
  },
  userProfiles: {
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
      create: "isAuthenticated",
      delete: "isOwner",
      update: "isOwner",
    },
  },
  didjyah_records: {
    bind: [
      "isAuthenticated",
      "auth.id != null",
      "isOwner",
      "data.owner == auth.id",
      "isGuestOwner",
      "data.owner in auth.ref('$user.linkedGuestUsers.id')",
      "isPremium",
      "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
    ],
    allow: {
      view: "isOwner || isGuestOwner",
      create:
        "isAuthenticated && (size(data.ref('owner.ownerTodos.id')) < 6 || isPremium)",
      delete: "isOwner || isGuestOwner",
      update: "isOwner || isGuestOwner",
    },
  },
} satisfies InstantRules;

export default rules;
