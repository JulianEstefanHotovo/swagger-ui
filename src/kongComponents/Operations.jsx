import React from "react"
import PropTypes from "prop-types"
import { createDeepLinkPath, sanitizeUrl } from "core/utils"
import YAML from "yaml-js"
import swagger2har from "swagger2har"

export default class Operations extends React.Component {

  static propTypes = {
    specSelectors: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    layoutSelectors: PropTypes.object.isRequired,
    layoutActions: PropTypes.object.isRequired,
    authActions: PropTypes.object.isRequired,
    authSelectors: PropTypes.object.isRequired,
    getConfigs: PropTypes.func.isRequired
  };

  render() {
    let {
      specSelectors,
      getComponent,
      layoutSelectors,
      layoutActions,
      getConfigs
    } = this.props

    let taggedOps = specSelectors.taggedOperations()
    const KongOperationsContainer = getComponent("KongOperationsContainer", true)
    const Markdown = getComponent("Markdown")

    const specStr = specSelectors.specStr()
    let parsedSpec
    let hars
    let harsKeyed = {}

    try {
      parsedSpec = YAML.load(specStr)
    } catch (error) {
      try {
        parsedSpec = JSON.parse(specStr)
      } catch (jsonError) {
        parsedSpec = null
        hars = null
        harsKeyed = null
      }
    }

    // if (!parsedSpec.openapi) {
      try {
        hars = swagger2har(parsedSpec)
      } catch (error) {
        console.trace(error)
      }
    // }

    if (hars != undefined) {
      hars.forEach(har => {
        harsKeyed[`${har.path}-${har.method.toLowerCase()}`] = har
      })
    } else {
      harsKeyed = null
    }

    let {
      docExpansion,
      maxDisplayedTags,
      deepLinking
    } = getConfigs()

    const isDeepLinkingEnabled = deepLinking && deepLinking !== "false"

    let filter = layoutSelectors.currentFilter()

    if (filter) {
      if (filter !== true) {
        taggedOps = taggedOps.filter((tagObj, tag) => {
          return tag.indexOf(filter) !== -1
        })
      }
    }

    if (maxDisplayedTags && !isNaN(maxDisplayedTags) && maxDisplayedTags >= 0) {
      taggedOps = taggedOps.slice(0, maxDisplayedTags)
    }

    return (
      <div className="operations-container">
        {
          taggedOps.map((tagObj, tag) => {
            let operations = tagObj.get("operations")
            let tagDescription = tagObj.getIn(["tagDetails", "description"], null)
            let tagExternalDocsDescription = tagObj.getIn(["tagDetails", "externalDocs", "description"])
            let tagExternalDocsUrl = tagObj.getIn(["tagDetails", "externalDocs", "url"])

            let isShownKey = ["operations-tag", createDeepLinkPath(tag)]
            let showTag = layoutSelectors.isShown(isShownKey, docExpansion === "full" || docExpansion === "list")

            return (
              <div className="opblock-tag-section" key={"operation-" + tag}>
                <div className="opblock-details col">
                  <h2
                    className={!tagDescription ? "opblock-tag no-desc" : "opblock-tag"}
                    id={isShownKey.join("-")}>
                    <a
                      className="nostyle"
                      onClick={isDeepLinkingEnabled ? (e) => e.preventDefault() : null}
                      href={isDeepLinkingEnabled ? `#/${tag}` : null}>
                      <span>{tag}</span>
                    </a>
                  </h2>

                  {!tagDescription ? null :
                    <Markdown source={tagDescription} />
                  }

                  {!tagExternalDocsDescription ? null :
                    <p className="opblock-ex-description">
                      {tagExternalDocsDescription}
                      {tagExternalDocsUrl ? ": " : null}
                      {tagExternalDocsUrl ?
                        <a
                          href={sanitizeUrl(tagExternalDocsUrl)}
                          onClick={(e) => e.stopPropagation()}
                          target={"_blank"}
                        >{tagExternalDocsUrl}</a> : null
                      }
                    </p>
                  }

                </div>
                {!harsKeyed ? null :
                  operations.map(op => {
                    const path = op.get("path")
                    const method = op.get("method")
                    const key = `${path}-${method}`
                     return <KongOperationsContainer
                      key={key}
                      har={harsKeyed[key].har || null}
                      op={op}
                      path={path}
                      method={method}
                      tag={tag}
                    />
                  }).toArray()
                }
                {harsKeyed ? null :
                  operations.map(op => {
                    const path = op.get("path")
                    const method = op.get("method")
                    const key = `${path}-${method}`
                     return <KongOperationsContainer
                      key={key}
                      op={op}
                      path={path}
                      method={method}
                      tag={tag}
                    />
                  }).toArray()
              }
              </div>
            )
          }).toArray()
        }

        {taggedOps.size < 1 ? <h3> No operations defined in spec! </h3> : null}
      </div>
    )
  }

}

Operations.propTypes = {
  layoutActions: PropTypes.object.isRequired,
  specSelectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  layoutSelectors: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  fn: PropTypes.object.isRequired
}
