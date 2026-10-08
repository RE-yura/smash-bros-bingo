export type FighterKind = "base" | "dlc" | "mii";

export type Fighter = {
  /** URL に入れる英字 ID（英語名ベース）。`.` は URL の区切りなので使わない */
  id: string;
  name: string;
  /** 公式データのシリーズキー。アイコンが読めないときの色分けに使う */
  series: string;
  kind: FighterKind;
  /** 公式アイコンのファイル名 */
  icon: string;
};

/** 公式のファイター番号順 */
export const FIGHTERS: readonly Fighter[] = [
  { id: "mario", name: "マリオ", series: "mario", kind: "base", icon: "mario" },
  {
    id: "donkey_kong",
    name: "ドンキーコング",
    series: "donkeykong",
    kind: "base",
    icon: "donkey_kong",
  },
  { id: "link", name: "リンク", series: "zelda", kind: "base", icon: "link" },
  { id: "samus", name: "サムス", series: "metroid", kind: "base", icon: "samus" },
  { id: "dark_samus", name: "ダークサムス", series: "metroid", kind: "base", icon: "dark_samus" },
  { id: "yoshi", name: "ヨッシー", series: "yoshi", kind: "base", icon: "yoshi" },
  { id: "kirby", name: "カービィ", series: "kirby", kind: "base", icon: "kirby" },
  { id: "fox", name: "フォックス", series: "starfox", kind: "base", icon: "fox" },
  { id: "pikachu", name: "ピカチュウ", series: "pokemon", kind: "base", icon: "pikachu" },
  { id: "luigi", name: "ルイージ", series: "mario", kind: "base", icon: "luigi" },
  { id: "ness", name: "ネス", series: "mother", kind: "base", icon: "ness" },
  {
    id: "captain_falcon",
    name: "キャプテン・ファルコン",
    series: "f-zero",
    kind: "base",
    icon: "captain_falcon",
  },
  { id: "jigglypuff", name: "プリン", series: "pokemon", kind: "base", icon: "purin" },
  { id: "peach", name: "ピーチ", series: "mario", kind: "base", icon: "peach" },
  { id: "daisy", name: "デイジー", series: "mario", kind: "base", icon: "daisy" },
  { id: "bowser", name: "クッパ", series: "mario", kind: "base", icon: "koopa" },
  {
    id: "ice_climbers",
    name: "アイスクライマー",
    series: "iceclimber",
    kind: "base",
    icon: "ice_climber",
  },
  { id: "sheik", name: "シーク", series: "zelda", kind: "base", icon: "sheik" },
  { id: "zelda", name: "ゼルダ", series: "zelda", kind: "base", icon: "zelda" },
  { id: "dr_mario", name: "ドクターマリオ", series: "mario", kind: "base", icon: "dr_mario" },
  { id: "pichu", name: "ピチュー", series: "pokemon", kind: "base", icon: "pichu" },
  { id: "falco", name: "ファルコ", series: "starfox", kind: "base", icon: "falco" },
  { id: "marth", name: "マルス", series: "fireemblem", kind: "base", icon: "marth" },
  { id: "lucina", name: "ルキナ", series: "fireemblem", kind: "base", icon: "lucina" },
  { id: "young_link", name: "こどもリンク", series: "zelda", kind: "base", icon: "young_link" },
  { id: "ganondorf", name: "ガノンドロフ", series: "zelda", kind: "base", icon: "ganondorf" },
  { id: "mewtwo", name: "ミュウツー", series: "pokemon", kind: "base", icon: "mewtwo" },
  { id: "roy", name: "ロイ", series: "fireemblem", kind: "base", icon: "roy" },
  { id: "chrom", name: "クロム", series: "fireemblem", kind: "base", icon: "chrom" },
  {
    id: "mr_game_and_watch",
    name: "Mr.ゲーム＆ウォッチ",
    series: "gamewatch",
    kind: "base",
    icon: "mr_game_and_watch",
  },
  { id: "meta_knight", name: "メタナイト", series: "kirby", kind: "base", icon: "meta_knight" },
  { id: "pit", name: "ピット", series: "palutena", kind: "base", icon: "pit" },
  { id: "dark_pit", name: "ブラックピット", series: "palutena", kind: "base", icon: "black_pit" },
  {
    id: "zero_suit_samus",
    name: "ゼロスーツサムス",
    series: "metroid",
    kind: "base",
    icon: "zero_suit_samus",
  },
  { id: "wario", name: "ワリオ", series: "wario", kind: "base", icon: "wario" },
  { id: "snake", name: "スネーク", series: "metalgear", kind: "base", icon: "snake" },
  { id: "ike", name: "アイク", series: "fireemblem", kind: "base", icon: "ike" },
  {
    id: "pokemon_trainer",
    name: "ポケモントレーナー",
    series: "pokemon",
    kind: "base",
    icon: "pokemon_trainer",
  },
  {
    id: "diddy_kong",
    name: "ディディーコング",
    series: "donkeykong",
    kind: "base",
    icon: "diddy_kong",
  },
  { id: "lucas", name: "リュカ", series: "mother", kind: "base", icon: "lucas" },
  { id: "sonic", name: "ソニック", series: "sonic", kind: "base", icon: "sonic" },
  { id: "king_dedede", name: "デデデ", series: "kirby", kind: "base", icon: "dedede" },
  {
    id: "olimar",
    name: "ピクミン&オリマー",
    series: "pikmin",
    kind: "base",
    icon: "pikmin_and_olimar",
  },
  { id: "lucario", name: "ルカリオ", series: "pokemon", kind: "base", icon: "lucario" },
  { id: "rob", name: "ロボット", series: "famicomrobot", kind: "base", icon: "robot" },
  { id: "toon_link", name: "トゥーンリンク", series: "zelda", kind: "base", icon: "toon_link" },
  { id: "wolf", name: "ウルフ", series: "starfox", kind: "base", icon: "wolf" },
  { id: "villager", name: "むらびと", series: "doubutsu", kind: "base", icon: "murabito" },
  { id: "mega_man", name: "ロックマン", series: "rockman", kind: "base", icon: "rockman" },
  {
    id: "wii_fit_trainer",
    name: "Wii Fitトレーナー",
    series: "wii_fit",
    kind: "base",
    icon: "wii_fit_trainer",
  },
  {
    id: "rosalina_and_luma",
    name: "ロゼッタ＆チコ",
    series: "mario",
    kind: "base",
    icon: "rosetta_and_chiko",
  },
  {
    id: "little_mac",
    name: "リトル・マック",
    series: "punch_out",
    kind: "base",
    icon: "little_mac",
  },
  { id: "greninja", name: "ゲッコウガ", series: "pokemon", kind: "base", icon: "gekkouga" },
  {
    id: "mii_brawler",
    name: "Miiファイター（格闘タイプ）",
    series: "mii",
    kind: "mii",
    icon: "mii_fighter",
  },
  {
    id: "mii_swordfighter",
    name: "Miiファイター（剣術タイプ）",
    series: "mii",
    kind: "mii",
    icon: "mii_fighter",
  },
  {
    id: "mii_gunner",
    name: "Miiファイター（射撃タイプ）",
    series: "mii",
    kind: "mii",
    icon: "mii_fighter",
  },
  { id: "palutena", name: "パルテナ", series: "palutena", kind: "base", icon: "palutena" },
  { id: "pac_man", name: "パックマン", series: "pacman", kind: "base", icon: "pac_man" },
  { id: "robin", name: "ルフレ", series: "fireemblem", kind: "base", icon: "reflet" },
  { id: "shulk", name: "シュルク", series: "xenoblade", kind: "base", icon: "shulk" },
  { id: "bowser_jr", name: "クッパJr.", series: "mario", kind: "base", icon: "koopa_jr" },
  { id: "duck_hunt", name: "ダックハント", series: "duckhunt", kind: "base", icon: "duck_hunt" },
  { id: "ryu", name: "リュウ", series: "streetfighter", kind: "base", icon: "ryu" },
  { id: "ken", name: "ケン", series: "streetfighter", kind: "base", icon: "ken" },
  { id: "cloud", name: "クラウド", series: "finalfantasy", kind: "base", icon: "cloud" },
  { id: "corrin", name: "カムイ", series: "fireemblem", kind: "base", icon: "kamui" },
  { id: "bayonetta", name: "ベヨネッタ", series: "bayonetta", kind: "base", icon: "bayonetta" },
  { id: "inkling", name: "インクリング", series: "splatoon", kind: "base", icon: "inkling" },
  { id: "ridley", name: "リドリー", series: "metroid", kind: "base", icon: "ridley" },
  { id: "simon", name: "シモン", series: "dracula", kind: "base", icon: "simon" },
  { id: "richter", name: "リヒター", series: "dracula", kind: "base", icon: "richter" },
  {
    id: "king_k_rool",
    name: "キングクルール",
    series: "donkeykong",
    kind: "base",
    icon: "king_k_rool",
  },
  { id: "isabelle", name: "しずえ", series: "doubutsu", kind: "base", icon: "shizue" },
  { id: "incineroar", name: "ガオガエン", series: "pokemon", kind: "base", icon: "gaogaen" },
  {
    id: "piranha_plant",
    name: "パックンフラワー",
    series: "mario",
    kind: "dlc",
    icon: "packun_flower",
  },
  { id: "joker", name: "ジョーカー", series: "persona", kind: "dlc", icon: "joker" },
  { id: "hero", name: "勇者", series: "dragonquest", kind: "dlc", icon: "dq_hero" },
  {
    id: "banjo_and_kazooie",
    name: "バンジョー&カズーイ",
    series: "banjo_and_kazooie",
    kind: "dlc",
    icon: "banjo_and_kazooie",
  },
  { id: "terry", name: "テリー", series: "garou", kind: "dlc", icon: "terry" },
  { id: "byleth", name: "ベレス", series: "fireemblem", kind: "dlc", icon: "byleth" },
  { id: "min_min", name: "ミェンミェン", series: "arms", kind: "dlc", icon: "minmin" },
  { id: "steve", name: "スティーブ", series: "minecraft", kind: "dlc", icon: "steve" },
  { id: "sephiroth", name: "セフィロス", series: "finalfantasy", kind: "dlc", icon: "sephiroth" },
  { id: "pyra_mythra", name: "ホムラ･ヒカリ", series: "xenoblade", kind: "dlc", icon: "homura" },
  { id: "kazuya", name: "カズヤ", series: "tekken", kind: "dlc", icon: "kazuya" },
  { id: "sora", name: "ソラ", series: "kingdomhearts", kind: "dlc", icon: "sora" },
];

const FIGHTERS_BY_ID: ReadonlyMap<string, Fighter> = new Map(FIGHTERS.map((f) => [f.id, f]));

export const findFighter = (id: string): Fighter | undefined => FIGHTERS_BY_ID.get(id);

export const isFighterId = (value: unknown): value is string =>
  typeof value === "string" && FIGHTERS_BY_ID.has(value);

export const iconUrl = (fighter: Fighter): string =>
  `https://www.smashbros.com/assets_v2/img/fighter/pict/${fighter.icon}.png`;

const FALLBACK_COLORS = [
  "bg-rose-600",
  "bg-orange-600",
  "bg-amber-600",
  "bg-lime-600",
  "bg-emerald-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-fuchsia-600",
] as const;

/** シリーズごとに決まった背景色クラスを返す（アイコンが読めないときの代わりの表示用） */
export function seriesColorClass(series: string): string {
  let hash = 0;
  for (const char of series) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] ?? FALLBACK_COLORS[0];
}
