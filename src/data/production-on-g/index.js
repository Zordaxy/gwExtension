import { Machineguns } from "./items-machineguns";
import { SniperRifles } from "./items-sniper-rifles";
import { BodyArmour } from "./items-body-armour";
import { AccessoriesHl } from "./items-accessories-hl";
import { Accessories } from "./items-accessories";
import { AssaultRifles } from "./items-assault-rifles";
import { Other } from "./items-other";

export const shopTypes = Object.freeze({
  MACHINEGUN_HL: "Machineguns",
  RIFLE_HL: "Sniper rifles",
  CHEST_HL: "Body Armour",
  ACCESSORIES_HL: "Accessories",
  ACCESSORIES: "Accessories light",
  ASSAULT_RIFLES_HL: "Assault rifles",
});

export const ProductionOnG = [
  ...Machineguns,
  ...SniperRifles,
  ...BodyArmour,
  ...AccessoriesHl,
  ...Accessories,
  ...AssaultRifles,
  ...Other,
];
