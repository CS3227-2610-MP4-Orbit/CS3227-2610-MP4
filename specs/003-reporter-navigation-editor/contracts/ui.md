# UI contract

- Navigation links: `/`, `/reports`, `/reports/new`; active route has `aria-current="page"`.
- Detail section links: `#report-details`, `#report-feedback`; both sections remain accessible in the DOM.
- Code input: exactly one successful form control named `python_code`, maxlength 20000, required, containing the latest edited text. It remains usable before hydration and after a server action validation error.
