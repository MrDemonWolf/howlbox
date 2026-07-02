// Twitch's own default palette, assigned the same way Twitch does for
// users who never picked a chat color (first + last char code hash),
// so fallback colors match what viewers see on twitch.tv.
const TWITCH_DEFAULT_COLORS = [
	"#FF0000",
	"#0000FF",
	"#008000",
	"#B22222",
	"#FF7F50",
	"#9ACD32",
	"#FF4500",
	"#2E8B57",
	"#DAA520",
	"#D2691E",
	"#5F9EA0",
	"#1E90FF",
	"#FF69B4",
	"#8A2BE2",
	"#00FF7F",
] as const;

export function fallbackColor(login: string): string {
	if (login.length === 0) {
		return TWITCH_DEFAULT_COLORS[0];
	}
	const index =
		(login.charCodeAt(0) + login.charCodeAt(login.length - 1)) %
		TWITCH_DEFAULT_COLORS.length;
	return TWITCH_DEFAULT_COLORS[index] ?? TWITCH_DEFAULT_COLORS[0];
}
