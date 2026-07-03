// Curated well-known chat bots, hidden when ?hidebots is set.
// Deliberately conservative: heuristics like "name ends in bot"
// hit real users, so unknown bots go in the ?hide= list instead.
export const KNOWN_BOTS: ReadonlySet<string> = new Set([
	"nightbot",
	"streamelements",
	"streamlabs",
	"moobot",
	"fossabot",
	"wizebot",
	"botisimo",
	"sery_bot",
	"soundalerts",
	"blerp",
	"own3d",
	"creatisbot",
	"tangiabot",
	"pokemoncommunitygame",
	"kofistreambot",
	"streamstickers",
	"botrix",
	"lumiastream",
	"songlistbot",
	"streamcaptainbot",
]);
