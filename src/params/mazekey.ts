/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param) {
    return /^[a-zA-Z2-7]{24}$|^[a-zA-Z2-7]{40}$/.test(param);
}
