# QA Findings

- **Student record dialog:** The reported screenshot shows student-table content visually bleeding through the modal. The shared dialog used the semantic `bg-background` utility, whose current token setup does not guarantee an opaque CSS color surface. The dialog should use an explicit white surface and ink text.
- **Mobile resilience:** Dialog content needs a viewport-bounded height with internal scrolling so long forms cannot clip behind the browser viewport.
