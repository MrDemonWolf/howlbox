// The HowlBox paw, same geometry as public/favicon.svg so the header mark
// and the browser tab are one identity. Kept as a component rather than an
// <img> so it inherits currentColor and needs no extra network request.
// If the paw in favicon.svg changes, change it here too.
export function PawMark({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="currentColor"
			focusable="false"
			viewBox="0 0 64 64"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M32 33c-6.6 0-12 4.3-12 9.6 0 3.6 2.8 5.4 6.2 5.4 2.2 0 3.9-1 5.8-1s3.6 1 5.8 1c3.4 0 6.2-1.8 6.2-5.4C44 37.3 38.6 33 32 33Z" />
			<ellipse cx="20.5" cy="28" rx="4" ry="5.2" />
			<ellipse cx="43.5" cy="28" rx="4" ry="5.2" />
			<ellipse cx="27" cy="21.5" rx="3.6" ry="4.8" />
			<ellipse cx="37" cy="21.5" rx="3.6" ry="4.8" />
		</svg>
	);
}
