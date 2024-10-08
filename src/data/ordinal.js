import { ProductionOnZ } from './production-on-z';
import { ProductionOnG } from './production-on-g';

export const Ordinal = {
    list: [
        //{name: "category0", category: "Первичные ресурсы"},
        //Первичные ресурсы
        //{name: "aluminium", hours: 1, power: 1, uranium: 15, boxites: 30, solomka: 25},
        //{name: "bauxite", hours: 2, power: 1, uranium: 9},
        //{name: "ganjium", hours: 1, power: 1, uranium: 6, grass: 40},
        //{name: "solomka", hours: 3, power: 1, uranium: 6},
        //{name: "weed", hours: 3, power: 1, uranium: 6},
        //{name: "metal", hours: 10, power: 1},
        //{name: "uran", hours: 3, power: 1},
        //{name: "up_distance", hours: 15, power: 1, uranium: 2, ganjium: 30, steel: 10, aluminium: 10},
        //{name: "up_armour", hours: 8, power: 1, ganjium: 15, aluminium: 10},
        //{name: "up_helmet", hours: 8, power: 1, ganjium: 13, aluminium: 10},
        //Пистолеты
        { name: "category1", category: "Пистолеты" },
        //{name: "rogatka", hours: 1, power: 1, uranium: 6, grass: 9, ganjium: 3, steel: 6},
        //{name: "bcpistols", hours: 1, power: 1, uranium: 6, grass: 10, ganjium: 10, steel: 30},
        //{name: "ttpistols", hours: 1, power: 1, uranium: 6, grass: 12, ganjium: 22, steel: 32},
        //{name: "eagle", hours: 2, power: 1, uranium: 6, grass: 12, ganjium: 28, steel: 35},
        { name: "uzi", hours: 2, power: 1, uranium: 6, grass: 38, ganjium: 33, steel: 34, duration: 13 },
        { name: "ump", hours: 3, power: 1, uranium: 21, grass: 50, ganjium: 45, steel: 40, duration: 20 },
        { name: "m4", hours: 6, power: 1, uranium: 36, grass: 140, ganjium: 105, steel: 100, duration: 22 },
        { name: "kashtan", hours: 6, power: 1, uranium: 36, grass: 190, ganjium: 110, steel: 100, duration: 18 },
        { name: "fmk3", hours: 12, power: 1, uranium: 70, ganjium: 132, steel: 146, aluminium: 53, duration: 20 },
        { name: "vihr", hours: 8, power: 1, uranium: 48, grass: 220, ganjium: 175, steel: 190, duration: 20 },
        { name: "saf", hours: 14, power: 1, uranium: 82, ganjium: 154, steel: 171, aluminium: 61, duration: 20 },
        { name: "mpi81", hours: 13, power: 1, uranium: 78, ganjium: 147, steel: 163, aluminium: 59, duration: 20 },
        { name: "agram", hours: 14, power: 1, uranium: 82, ganjium: 154, steel: 171, aluminium: 61, duration: 20 },
        { name: "bizon", hours: 15, power: 1, uranium: 88, ganjium: 165, steel: 183, aluminium: 66, duration: 20 },
        { name: "kedr", hours: 17, power: 1, uranium: 100, ganjium: 187, steel: 207, aluminium: 75, duration: 20 },
        { name: "colt636", hours: 18, power: 1, uranium: 105, ganjium: 198, steel: 220, aluminium: 79, duration: 30 },
        { name: "scorpionevo", hours: 55, power: 1, uranium: 42, ganjium: 250, steel: 212, aluminium: 53, duration: 30 },
        { name: "berettamx4", hours: 23, power: 1, uranium: 140, ganjium: 263, steel: 293, aluminium: 105, duration: 30 },
        { name: "fmg9", hours: 23, power: 1, uranium: 125, ganjium: 263, steel: 293, aluminium: 105, duration: 30 },
        //Автоматы
        { name: "category2", category: "Автоматы" },
        //{name: "potato2", hours: 1, power: 1, uranium: 6, grass: 4, ganjium: 2, steel: 3},
        { name: "m16", hours: 3, power: 1, uranium: 21, grass: 47, ganjium: 50, steel: 40, duration: 20 },
        { name: "ak_74", hours: 4, power: 1, uranium: 6, grass: 65, ganjium: 48, steel: 55, duration: 20 },
        { name: "aks", hours: 4, power: 1, uranium: 6, grass: 76, ganjium: 55, steel: 45, duration: 14 },
        { name: "xm8", hours: 5, power: 1, uranium: 30, grass: 100, ganjium: 85, steel: 60, duration: 20 },
        { name: "steyr", hours: 10, power: 1, uranium: 30, grass: 310, ganjium: 150, steel: 100, duration: 22 },
        { name: "sig", hours: 8, power: 1, uranium: 51, grass: 300, ganjium: 240, steel: 180, duration: 24 },
        { name: "g3", hours: 12, power: 1, uranium: 72, grass: 330, ganjium: 250, steel: 190, duration: 20 },
        { name: "arx160", hours: 21, power: 1, uranium: 129, ganjium: 241, steel: 268, aluminium: 97, duration: 23 },
        { name: "sr88", hours: 23, power: 1, uranium: 140, ganjium: 263, steel: 293, aluminium: 105, duration: 23 },
        { name: "g3aa", hours: 21, power: 1, uranium: 129, ganjium: 241, steel: 268, aluminium: 97, duration: 21 },
        { name: "m82", hours: 30, power: 1, uranium: 178, ganjium: 334, steel: 371, aluminium: 133, duration: 25 },
        { name: "fs2000", hours: 40, power: 1, uranium: 238, ganjium: 446, steel: 495, aluminium: 178, duration: 28 },
        { name: "aps95", hours: 57, power: 1, uranium: 343, ganjium: 643, steel: 714, aluminium: 257, duration: 30 },
        { name: "bofors", hours: 47, power: 1, uranium: 281, ganjium: 527, steel: 585, aluminium: 211, duration: 30 },
        { name: "m17s", hours: 43, power: 1, uranium: 258, ganjium: 483, steel: 537, aluminium: 193, duration: 30 },
        { name: "hk417", hours: 41, power: 1, uranium: 246, ganjium: 461, steel: 512, aluminium: 184, duration: 30 },
        { name: "vektor", hours: 80, power: 1, uranium: 118, ganjium: 700, steel: 808, aluminium: 245, duration: 30 },
        { name: "tiger", hours: 49, power: 1, uranium: 293, ganjium: 549, steel: 610, aluminium: 220, duration: 30 },
        { name: "hk762", hours: 55, power: 1, uranium: 329, ganjium: 617, steel: 686, aluminium: 247, duration: 35 },
        { name: "enfield80", hours: 54, power: 1, uranium: 322, ganjium: 604, steel: 671, aluminium: 242, duration: 30 },
        { name: "cz805", hours: 55, power: 1, uranium: 330, ganjium: 630, steel: 680, aluminium: 245, duration: 30 },
        //Снайперские винтовки
        { name: "category3", category: "Снайперские винтовки" },
        { name: "l96", hours: 4, power: 1, uranium: 36, grass: 55, ganjium: 40, steel: 50, duration: 15 },
        { name: "m40", hours: 5, power: 1, uranium: 30, grass: 100, ganjium: 50, steel: 80, duration: 20 },
        { name: "mauser", hours: 6, power: 1, uranium: 36, grass: 120, ganjium: 120, steel: 90, duration: 20 },
        { name: "police", hours: 5, power: 1, uranium: 30, grass: 105, ganjium: 100, steel: 70, duration: 20 },
        { name: "ssg", hours: 8, power: 1, uranium: 48, grass: 180, ganjium: 190, steel: 170, duration: 20 },
        { name: "psg", hours: 8, power: 1, uranium: 48, grass: 245, ganjium: 150, steel: 120, duration: 22 },
        { name: "svd", hours: 10, power: 1, uranium: 60, grass: 430, ganjium: 220, steel: 200, duration: 24 },
        { name: "falcon", hours: 24, power: 1, uranium: 146, ganjium: 274, steel: 305, aluminium: 110, duration: 22 },
        { name: "savage10fp", hours: 36, power: 1, uranium: 213, ganjium: 400, steel: 444, aluminium: 160, duration: 23 },
        { name: "steyr_iws", hours: 39, power: 1, uranium: 235, ganjium: 441, steel: 490, aluminium: 176, duration: 24 },
        { name: "ulr338", hours: 48, power: 1, uranium: 228, ganjium: 540, steel: 600, aluminium: 216, duration: 24 },
        { name: "savage100fp", hours: 43, power: 1, uranium: 259, ganjium: 485, steel: 539, aluminium: 194, duration: 25 },
        { name: "tikka", hours: 48, power: 1, uranium: 290, ganjium: 544, steel: 605, aluminium: 218, duration: 25 },
        { name: "cz700", hours: 51, power: 1, uranium: 306, ganjium: 573, steel: 637, aluminium: 229, duration: 25 },
        { name: "bora", hours: 80, power: 1, uranium: 105, ganjium: 625, steel: 620, aluminium: 219, duration: 25 },
        { name: "ksv", hours: 54, power: 1, uranium: 322, ganjium: 604, steel: 671, aluminium: 241, duration: 25 },
        { name: "fd308", hours: 57, power: 1, uranium: 343, ganjium: 643, steel: 714, aluminium: 257, duration: 30 },
        { name: "r11", hours: 50, power: 1, uranium: 302, ganjium: 566, steel: 629, aluminium: 226, duration: 30 },
        { name: "bor762", hours: 57, power: 1, uranium: 343, ganjium: 643, steel: 714, aluminium: 257, duration: 28 },
        //Пулеметы
        { name: "category4", category: "Пулеметы" },
        { name: "fn_min", hours: 4, power: 1, uranium: 24, grass: 70, ganjium: 45, steel: 50, duration: 10 },
        { name: "fnmag", hours: 10, power: 1, uranium: 30, grass: 150, ganjium: 90, steel: 110, duration: 20 },
        { name: "bren", hours: 8, power: 1, uranium: 48, grass: 160, ganjium: 150, steel: 150, duration: 16 },
        { name: "l86", hours: 8, power: 1, uranium: 48, grass: 180, ganjium: 140, steel: 175, duration: 20 },
        { name: "saw", hours: 10, power: 1, uranium: 60, grass: 340, ganjium: 235, steel: 200, duration: 20 },
        { name: "nsv", hours: 18, power: 1, uranium: 105, ganjium: 198, steel: 220, aluminium: 79, duration: 22 },
        { name: "type67", hours: 21, power: 1, uranium: 129, ganjium: 241, steel: 268, aluminium: 97, duration: 23 },
        { name: "galil", hours: 20, power: 1, uranium: 117, ganjium: 220, steel: 244, aluminium: 88, duration: 20 },
        { name: "sig710", hours: 23, power: 1, uranium: 140, ganjium: 263, steel: 293, aluminium: 105, duration: 23 },
        { name: "vickers", hours: 40, power: 1, uranium: 240, ganjium: 450, steel: 500, aluminium: 180, duration: 25 },
        { name: "vz59", hours: 47, power: 1, uranium: 281, ganjium: 527, steel: 585, aluminium: 211, duration: 27 },
        { name: "mg4", hours: 57, power: 1, uranium: 343, ganjium: 643, steel: 714, aluminium: 257, duration: 28 },
        { name: "mg36", hours: 59, power: 1, uranium: 351, ganjium: 659, steel: 732, aluminium: 263, duration: 30 },
        { name: "m61", hours: 55, power: 1, uranium: 328, ganjium: 615, steel: 683, aluminium: 246, duration: 30 },
        { name: "aat", hours: 57, power: 1, uranium: 340, ganjium: 637, steel: 707, aluminium: 255, duration: 30 },
        { name: "xm312", hours: 49, power: 1, uranium: 293, ganjium: 549, steel: 610, aluminium: 220, duration: 30 },
        { name: "sturm", hours: 80, power: 1, uranium: 92, ganjium: 660, steel: 344, aluminium: 116, duration: 30 },
        { name: "venom", hours: 49, power: 1, uranium: 293, ganjium: 549, steel: 610, aluminium: 220, duration: 30 },
        { name: "fort401", hours: 57, power: 1, uranium: 343, ganjium: 643, steel: 714, aluminium: 257, duration: 35 },
        { name: "vektorss77", hours: 53, power: 1, uranium: 315, ganjium: 591, steel: 657, aluminium: 237, duration: 30 },
        { name: "xm806", hours: 57, power: 1, uranium: 340, ganjium: 640, steel: 715, aluminium: 250, duration: 30 },
        //Дробовики
        { name: "category5", category: "Дробовики" },
        { name: "remington", hours: 3, power: 1, uranium: 21, grass: 90, ganjium: 85, steel: 70, duration: 20 },
        { name: "jackhammer", hours: 9, power: 1, uranium: 54, grass: 310, ganjium: 210, steel: 160, duration: 20 },
        { name: "hunter", hours: 3, power: 1, uranium: 18, grass: 70, ganjium: 40, steel: 41, duration: 10 },
        { name: "sgun2", hours: 5, power: 1, uranium: 30, grass: 130, ganjium: 100, steel: 90, duration: 20 },
        { name: "saiga", hours: 8, power: 1, uranium: 48, grass: 300, ganjium: 175, steel: 155, duration: 12 },
        { name: "rmb93", hours: 15, power: 1, uranium: 88, ganjium: 165, steel: 183, aluminium: 66, duration: 20 },
        { name: "neostead", hours: 20, power: 1, uranium: 117, ganjium: 220, steel: 244, aluminium: 88, duration: 20 },
        { name: "xm26", hours: 17, power: 1, uranium: 100, ganjium: 187, steel: 207, aluminium: 75, duration: 18 },
        { name: "hawk", hours: 18, power: 1, uranium: 105, ganjium: 198, steel: 220, aluminium: 79, duration: 20 },
        { name: "liberator", hours: 70, power: 1, uranium: 92, grass: 1027, ganjium: 605, steel: 508, duration: 25 },
        { name: "benelli", hours: 23, power: 1, uranium: 140, ganjium: 263, steel: 239, aluminium: 105, duration: 25 },
        { name: "spas15", hours: 35, power: 1, uranium: 211, ganjium: 395, steel: 439, aluminium: 158, duration: 25 },
        { name: "r8", hours: 50, power: 1, uranium: 302, ganjium: 566, steel: 629, aluminium: 226, duration: 30 },
        { name: "versamax", hours: 46, power: 1, uranium: 274, ganjium: 514, steel: 571, aluminium: 206, duration: 30 },
        //Гранатометы
        { name: "category6", category: "Гранатометы" },
        { name: "rpg", hours: 14, power: 1, uranium: 184, grass: 600, ganjium: 400, steel: 350, duration: 20 },
        { name: "rpgu", hours: 50, power: 1, uranium: 76, ganjium: 522, steel: 133, aluminium: 158, duration: 16 },
        { name: "grom2", hours: 50, power: 1, uranium: 71, ganjium: 493, steel: 95, aluminium: 149, duration: 20 },
        { name: "ags30", hours: 50, power: 1, uranium: 63, ganjium: 435, steel: 12, aluminium: 131, duration: 30 },
        { name: "gm94", hours: 50, power: 1, uranium: 50, grass: 560, ganjium: 330, steel: 136, duration: 30 },
        { name: "gl06", hours: 50, power: 1, uranium: 55, grass: 607, ganjium: 358, steel: 191, duration: 30 },
        { name: "gmg", hours: 50, power: 1, uranium: 53, grass: 583, ganjium: 344, steel: 162, duration: 30 },
        { name: "balkan", hours: 29, power: 1, uranium: 176, ganjium: 392, steel: 366, aluminium: 123, duration: 30 },
        { name: "ptrk", hours: 16, power: 1, uranium: 96, ganjium: 180, steel: 200, aluminium: 72, duration: 15 },
        //Гранаты
        //{name: "category7", category: "Гранаты"},
        //{name: "lights", hours: 1, power: 1, uranium: 6, grass: 9, ganjium: 5, steel: 7},
        //{name: "grenade_f1", hours: 1, power: 1, uranium: 6, grass: 18, ganjium: 8, steel: 10},
        //{name: "rgd5", hours: 1, power: 1, uranium: 6, grass: 8, ganjium: 3, steel: 5},
        //{name: "rkg3", hours: 1, power: 1, uranium: 6, grass: 80, ganjium: 30, steel: 50},
        //{name: "emp_ir", hours: 1, power: 1, uranium: 10, ganjium: 41, steel: 46, aluminium: 13},
        //{name: "emp_s", hours: 1, power: 1, uranium: 14, ganjium: 55, steel: 64, aluminium: 18},
        //{name: "m3", hours: 1, power: 1, uranium: 12, ganjium: 51, steel: 31, aluminium: 15},
        //{name: "hg78", hours: 1, power: 1, uranium: 18, grass: 100, ganjium: 43, steel: 35},
        //{name: "hg84", hours: 1, power: 1, uranium: 17, grass: 96, ganjium: 41, steel: 36},
        //{name: "m34ph", hours: 1, power: 1, uranium: 13, ganjium: 52, steel: 60, aluminium: 16},
        //{name: "anm14", hours: 1, power: 1, uranium: 18, ganjium: 43, steel: 52, aluminium: 15},
        //{name: "fg6", hours: 1, power: 1, uranium: 22, grass: 120, ganjium: 51, steel: 46},
        //Гранаты синдиката
        //{name: "category8", category: "Гранаты синдиката"},
        //{name: "lightss", hours: 1, power: 1, uranium: 4, grass: 20, ganjium: 8, steel: 4},
        //{name: "lightsm", hours: 1, power: 1, uranium: 8, grass: 100, ganjium: 30, steel: 50},
        //{name: "rgd2s", hours: 1, power: 1, uranium: 1, grass: 36, ganjium: 1, steel: 33},
        //{name: "grenade_dg1", hours: 1, power: 1, uranium: 10, grass: 66, ganjium: 25, steel: 40},
        //{name: "fg5", hours: 1, power: 1, uranium: 5, grass: 58, ganjium: 20, steel: 20},
        //{name: "molotov", hours: 1, power: 1, uranium: 6, grass: 8, ganjium: 3, steel: 1},
        //{name: "hellsbreath", hours: 1, power: 1, uranium: 3, grass: 10, ganjium: 6, steel: 1},
        //{name: "napalm", hours: 1, power: 1, uranium: 7, grass: 10, ganjium: 4, steel: 1},
        //{name: "me85", hours: 1, power: 1, uranium: 11, grass: 68, ganjium: 24, steel: 41},
        //Броня головы
        { name: "category9", category: "Броня головы" },
        //{name: "helm1", hours: 1, power: 1, uranium: 6, solomka: 32, ganjium: 12, steel: 15},
        //{name: "helm3", hours: 4, power: 1, uranium: 24, solomka: 110, ganjium: 100, steel: 75},
        { name: "m1helmet", hours: 12, power: 1, uranium: 74, solomka: 269, ganjium: 128, steel: 103, duration: 20 },
        { name: "pasfgt", hours: 19, power: 1, uranium: 114, solomka: 412, ganjium: 197, steel: 159, duration: 24 },
        { name: "achelmet", hours: 55, power: 1, uranium: 42, grass: 469, ganjium: 251, steel: 98, duration: 26 },
        { name: "defender", hours: 23, power: 1, uranium: 137, solomka: 493, ganjium: 235, steel: 190, duration: 26 },
        //Броня
        { name: "category10", category: "Броня" },
        //{name: "bronik1", hours: 2, power: 1, uranium: 12, solomka: 65, ganjium: 48, steel: 35, duration:20},
        //{name: "bronik2", hours: 6, power: 1, uranium: 36, solomka: 200, ganjium: 135, steel: 120, duration:20},
        { name: "bronik3", hours: 8, power: 1, uranium: 48, solomka: 215, ganjium: 160, steel: 120, duration: 20 },
        //{name: "tset", hours: 8, power: 1, uranium: 48, solomka: 230, ganjium: 100, steel: 150, duration:15},
        { name: "bronik5", hours: 25, power: 1, uranium: 149, solomka: 538, ganjium: 257, steel: 207, duration: 24 },
        { name: "soarmour", hours: 55, power: 1, uranium: 46, grass: 513, ganjium: 275, steel: 168, duration: 24 },
        { name: "bronik6", hours: 27, power: 1, uranium: 161, solomka: 538, ganjium: 278, steel: 224, duration: 25 },
        { name: "carmour", hours: 31, power: 1, uranium: 186, solomka: 672, ganjium: 321, steel: 259, duration: 26 },
        { name: "sarmour7", hours: 33, power: 1, uranium: 199, solomka: 717, ganjium: 342, steel: 276, duration: 26 },
        { name: "armour_alpha", hours: 35, power: 1, uranium: 211, solomka: 762, ganjium: 363, steel: 293, duration: 27 },
        //Броня ног
        { name: "category11", category: "Броня ног" },
        //{name: "boots1", hours: 2, power: 1, uranium: 12, solomka: 24, ganjium: 12, steel: 20},
        //{name: "boots3", hours: 6, power: 1, uranium: 36, solomka: 130, ganjium: 130, steel: 70},
        { name: "armyboots", hours: 12, power: 1, uranium: 74, solomka: 269, ganjium: 120, steel: 103, duration: 22 },
        { name: "hshields", hours: 16, power: 1, uranium: 97, solomka: 350, ganjium: 167, steel: 134, duration: 24 },
        { name: "kboots", hours: 20, power: 1, uranium: 118, solomka: 426, ganjium: 203, steel: 164, duration: 26 },
        { name: "shboots", hours: 25, power: 1, uranium: 149, solomka: 538, ganjium: 257, steel: 207, duration: 28 },
        { name: "desertboots", hours: 25, power: 1, uranium: 150, solomka: 530, ganjium: 257, steel: 207, duration: 28 },
        //Маскировка
        { name: "category12", category: "Маскировка" },
        //{name: "mask1", hours: 4, power: 1, uranium: 24, solomka: 100, ganjium: 42, steel: 20, duration:20},
        { name: "mask2", hours: 6, power: 1, uranium: 36, solomka: 370, ganjium: 105, steel: 30, duration: 20 },
        //{name: "prohunter", hours: 5, power: 1, uranium: 30, grass: 100, ganjium: 50, steel: 80, duration:18},
        //{name: "killsuit", hours: 5, power: 1, uranium: 30, grass: 100, ganjium: 85, steel: 60, duration:18},
        { name: "woodland", hours: 6, power: 1, uranium: 36, solomka: 200, ganjium: 135, steel: 120, duration: 24 },
        { name: "huntercamo", hours: 25, power: 1, uranium: 100, solomka: 360, ganjium: 170, steel: 130, duration: 30 },
        //Тепловизоры
        { name: "category13", category: "Тепловизоры" },
        { name: "svision", hours: 9, power: 1, uranium: 54, solomka: 280, ganjium: 210, steel: 250, duration: 20 },
        //Аксессуары
        { name: "category14", category: "Аксессуары" },
        //{name: "sumka", hours: 3, power: 1, uranium: 18, solomka: 63, ganjium: 35, steel: 35},
        //{name: "sme45", hours: 1, power: 1, uranium: 6, solomka: 30, ganjium: 10, steel: 10, duration:20},
        //{name: "nokia8910", hours: 2, power: 1, uranium: 12, solomka: 100, ganjium: 75, steel: 33, duration:20},
        //{name: "st300", hours: 2, power: 1, uranium: 12, solomka: 39, ganjium: 18, steel: 40, duration:10},
        //{name: "px11", hours: 6, power: 1, uranium: 36, solomka: 150, ganjium: 60, steel: 60, duration:15},
        //{name: "nokia7200", hours: 6, power: 1, uranium: 36, solomka: 130, ganjium: 62, steel: 50, duration:15},
        //{name: "nokia6110", hours: 10, power: 1, uranium: 62, solomka: 224, ganjium: 107, steel: 86, duration:25},
        //{name: "camobelt", hours: 6, power: 1, uranium: 34, solomka: 124, ganjium: 59, steel: 48, duration:15},
        { name: "carryingvest", hours: 20, power: 1, uranium: 90, solomka: 370, ganjium: 180, steel: 138, duration: 18 },
        { name: "n82", hours: 17, power: 1, uranium: 99, solomka: 359, ganjium: 171, steel: 138, duration: 27 },
        { name: "binocular1", hours: 25, power: 1, uranium: 149, solomka: 538, ganjium: 256, steel: 207, duration: 25 },
        { name: "binocular2", hours: 34, power: 1, uranium: 200, solomka: 700, ganjium: 330, steel: 260, duration: 30 },
        { name: "watch_com", hours: 30, power: 1, uranium: 180, solomka: 650, ganjium: 350, steel: 250, duration: 20 },
        { name: "saperka", hours: 17, power: 1, uranium: 99, solomka: 359, ganjium: 171, steel: 138, duration: 20 },
        { name: "saperka2", hours: 6, power: 1, uranium: 37, solomka: 134, ganjium: 64, steel: 52, duration: 15 },
        { name: "engineerbelt", hours: 30, power: 1, uranium: 180, solomka: 650, ganjium: 310, steel: 250, duration: 26 },
        { name: "synergic", hours: 23, power: 1, uranium: 140, ganjium: 263, steel: 293, aluminium: 105, duration: 25 },
        { name: "multitool", hours: 20, power: 1, uranium: 150, ganjium: 270, steel: 290, aluminium: 110, duration: 20 },
        { name: "sw_m203", hours: 27, power: 1, uranium: 164, solomka: 591, ganjium: 282, steel: 227, duration: 1 },
        { name: "mercbelt", hours: 33, power: 1, uranium: 196, solomka: 709, ganjium: 338, steel: 273, duration: 30 },
        { name: "greenbook", hours: 29, power: 1, uranium: 176, ganjium: 329, steel: 366, aluminium: 132, duration: 25 },
        { name: "armybelt", hours: 30, power: 1, uranium: 180, solomka: 500, ganjium: 310, steel: 250, duration: 25 },
        { name: "adv_multitool", hours: 23, power: 1, uranium: 150, ganjium: 265, steel: 290, aluminium: 100, duration: 20 },
        //Транспорт
        //{name: "category15", category: "Транспорт"},
        //{name: "bike", hours: 1, power: 1, uranium: 6, solomka: 7, ganjium: 5, steel: 5, duration:20},
        //{name: "moto", hours: 4, power: 1, uranium: 24, solomka: 35, ganjium: 30, steel: 30, duration:30},
        //{name: "celica", hours: 3, power: 1, uranium: 27, solomka: 40, ganjium: 45, steel: 65, duration:20},
        //{name: "cessna", hours: 23, power: 1, uranium: 137, ganjium: 257, steel: 286, aluminium: 103, duration:25},
        //{name: "h1", hours: 18, power: 1, uranium: 110, ganjium: 206, steel: 229, aluminium: 82, duration:30},
        //{name: "mack", hours: 16, power: 1, uranium: 96, ganjium: 180, steel: 200, aluminium: 72, duration:25},
        //{name: "virago", hours: 17, power: 1, uranium: 103, ganjium: 193, steel: 214, aluminium: 77, duration:25}
        //Аут
        { name: "perch", hours: 1, duration: 1 },
        { name: "old_rgd5", hours: 1, duration: 1 },
        { name: "stimpack_armour", hours: 1, duration: 1 },
        { name: "stimpack_iddqd_xl", hours: 1, duration: 2 },
        { name: "l83a1", hours: 1, duration: 1 },
        { name: "hk53", hours: 1, duration: 10 },
        { name: "heavyboots", hours: 1, duration: 10 },
        { name: "water", hours: 1, duration: 1 },
        { name: "dinamit", hours: 1, duration: 1 },
        { name: "m84", hours: 1, duration: 1 },
        { name: "stimpack_armour_xl", hours: 1, duration: 2 },
        { name: "helmet2", hours: 1, duration: 10 },
        { name: "stimpack_dmg", hours: 1, duration: 1 },
        { name: "travelkit", hours: 1, duration: 1 },
        { name: "tbelt", hours: 1, duration: 10 },
        { name: "stimpack_iddqd", hours: 1, duration: 1 },
        { name: "stimpack_dmg_xl", hours: 1, duration: 2 },
        { name: "bandage", hours: 1, duration: 2 },
        { name: "coffee", hours: 1, duration: 2 },
        { name: "stimpack_spd", hours: 1, duration: 1 }
    ],

    get(id) {
        return [ ...ProductionOnG, ...ProductionOnZ ].find(elem => {
            return elem.id === id
        });
    },

    getIDs() {
        return ProductionOnG.filter(item => item.id).map(item => item.id);
    },

    getGroupedElements() {
        const itemsWithGroup = ProductionOnG.filter(x => x.shopType);
        return Object.groupBy(itemsWithGroup, (x) => x.shopType);
    },

    parsingScripts() {
        function parseEntry(entry) {
            const island = entry.substring(1, 2);
            const name = entry.substring(3, entry.length - 3).trim();
            return {name, island};
        }

        let list = [...document.querySelector('[id="goods"]')
            .querySelectorAll('option')]
            .map(option => option.innerText)
            .map(option => parseEntry(option))
            .filter(option => option.island === 'Z')
            .map(option => option.name)
            .map(option => `{ name: '${option}' }`)
            .join(', ')
        list;

        function parseResources(name) {
            function getResName(node) {
                return node.parentNode.parentNode.querySelector('td').innerText;
            }
    
            const hours = document.querySelector('[id="whour"]').value;
            const power = document.querySelector('[id="qty_pitem_1"]').value;
            const res1 = document.querySelector('[id="qty_item_1"]');
            const res2 = document.querySelector('[id="qty_item_2"]');
            const res3 = document.querySelector('[id="qty_item_3"]');
            const res4 = document.querySelector('[id="qty_item_4"]');
            const res5 = document.querySelector('[id="qty_item_5"]');
    
            return `{ name: '${name}', id: '', hours: ${hours}, power: ${power}, ${getResName(res1)}: ${res1.value}, ${getResName(res2)}: ${res2.value}, ${getResName(res3)}: ${res3.value}, ${getResName(res4)}: ${res4.value}${res5 ? ", " + getResName(res5) + ': ' + res4.value : ''} },`;
        }
        parseResources('AAT m.52');

        

    }
}



// \n