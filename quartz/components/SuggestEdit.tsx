import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { joinSegments, pathToRoot } from "../util/path"
import { classNames } from "../util/lang"

export default (() => {
  const SuggestEdit: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const href = joinSegments(pathToRoot(fileData.slug!), "admin/")
    return (
      <p class={classNames(displayClass, "suggest-edit")}>
        <a href={href} data-router-ignore>
          Suggest an edit
        </a>
      </p>
    )
  }

  SuggestEdit.displayName = "SuggestEdit"
  SuggestEdit.css = `
  .suggest-edit {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
  }
  .suggest-edit a {
    color: var(--gray);
    background-color: transparent;
  }
  .suggest-edit a:hover {
    color: var(--secondary);
  }
  `
  return SuggestEdit
}) satisfies QuartzComponentConstructor
