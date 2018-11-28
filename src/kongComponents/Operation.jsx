import React, { PureComponent } from "react"
import PropTypes from "prop-types"
import { getList } from "core/utils"
import { getExtensions, sanitizeUrl } from "core/utils"
import { Iterable } from "immutable"

import TryItOutButton from "./try-it-out-button"
import Execute from "./execute"
import Clear from "./clear"
import Responses from "./responses"

export default class Operation extends PureComponent {
  static propTypes = {
    specPath: ImPropTypes.list.isRequired,
    operation: PropTypes.instanceOf(Iterable).isRequired,
    response: PropTypes.instanceOf(Iterable),
    request: PropTypes.instanceOf(Iterable),

    toggleShown: PropTypes.func.isRequired,
    onTryoutClick: PropTypes.func.isRequired,
    onCancelClick: PropTypes.func.isRequired,
    onExecute: PropTypes.func.isRequired,

    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired,
    authActions: PropTypes.object,
    authSelectors: PropTypes.object,
    specActions: PropTypes.object.isRequired,
    specSelectors: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    oas3Selectors: PropTypes.object.isRequired,
    layoutActions: PropTypes.object.isRequired,
    layoutSelectors: PropTypes.object.isRequired,
    fn: PropTypes.object.isRequired
  }

  static defaultProps = {
    operation: null,
    response: null,
    request: null
  }

  render () {
    let {
      specPath,
      response,
      request,
      toggleShown,
      onTryoutClick,
      onCancelClick,
      onExecute,
      fn,
      getComponent,
      getConfigs,
      specActions,
      specSelectors,
      authActions,
      authSelectors,
      oas3Actions,
      oas3Selectors
    } = this.props
    let operationProps = this.props.operation

    let {
      isShown,
      isAuthorized,
      har,
      jumpToKey,
      path,
      method,
      op,
      tag,
      showSummary,
      operationId,
      allowTryItOut,
      displayOperationId,
      displayRequestDuration,
      isDeepLinkingEnabled,
      tryItOutEnabled,
      executeInProgress
    } = operationProps.toJS()

    let {
      summary,
      description,
      deprecated,
      externalDocs,
      schemes
    } = op.operation

    let operation = operationProps.getIn(["op", "operation"])
    let security = operationProps.get("security")
    let responses = operation.get("responses")
    let produces = operation.get("produces")
    let parameters = getList(operation, ["parameters"])
    let operationScheme = specSelectors.operationScheme(path, method)
    let isShownKey = ["operations", tag, operationId]
    let extensions = getExtensions(operation)

    // const Responses = getComponent("responses")
    const KongParameters = getComponent("KongParameters")
    const AuthorizeOperationBtn = getComponent("authorizeOperationBtn")
    const JumpToPath = getComponent("JumpToPath", true)
    const Collapse = getComponent("Collapse")
    const Markdown = getComponent("Markdown")
    const Schemes = getComponent("schemes")
    const OperationServers = getComponent("OperationServers")
    const OperationExt = getComponent("OperationExt")

    const { showExtensions } = getConfigs()

    // Merge in Live Response
    if (responses && response && response.size > 0) {
      let notDocumented = !responses.get(String(response.get("status")))
      response = response.set("notDocumented", notDocumented)
    }

    let onChangeKey = [path, method] // Used to add values to _this_ operation ( indexed by path and method )

    return (
      <div className={deprecated ? "opblock opblock-deprecated" : `opblock opblock-${method} wrapper`} id={isShownKey.join("-")} >
        <div className="col">
          <div className="opblock-summary-description">
            {!showSummary ? null :
              <span>{summary}</span>
            }
            {displayOperationId && operationId ? <span className="opblock-summary-operation-id">{operationId}</span> : null}
            {
              (!security || !security.count()) ? null :
                <AuthorizeOperationBtn
                  isAuthorized={isAuthorized}
                  onClick={() => {
                    const applicableDefinitions = authSelectors.definitionsForRequirements(security)
                    authActions.showDefinitions(applicableDefinitions)
                  }}
                />
            }
          </div>

          <div className={`opblock-summary opblock-summary-${method}`} >
            <span className="opblock-summary-method">{method.toUpperCase()}</span>
            <span className={deprecated ? "opblock-summary-path__deprecated" : "opblock-summary-path"} >
              <a
                className="nostyle"
                onClick={isDeepLinkingEnabled ? (e) => e.preventDefault() : null}
                href={isDeepLinkingEnabled ? `#/${isShownKey.join("/")}` : null}>
                <span>{path}</span>
              </a>
              <JumpToPath path={jumpToKey} />
            </span>
          </div>
          <div className="opblock-body">
            {deprecated && <h4 className="opblock-title_normal"> Warning: Deprecated</h4>}
            {description &&
              <div className="opblock-description-wrapper">
                <div className="opblock-description">
                  <Markdown source={description} />
                </div>
              </div>
            }
            {
              externalDocs && externalDocs.url ?
                <div className="opblock-external-docs-wrapper">
                  <h4 className="opblock-title_normal">Find more details</h4>
                  <div className="opblock-external-docs">
                    <span className="opblock-external-docs__description">
                      <Markdown source={externalDocs.description} />
                    </span>
                    <a target="_blank" className="opblock-external-docs__link" href={sanitizeUrl(externalDocs.url)}>{externalDocs.url}</a>
                  </div>
                </div> : null
            }

            <KongParameters
              parameters={parameters}
              specPath={specPath.push("parameters")}
              operation={operation}
              onChangeKey={onChangeKey}
              onTryoutClick={onTryoutClick}
              onCancelClick={onCancelClick}
              tryItOutEnabled={tryItOutEnabled}
              allowTryItOut={allowTryItOut}

              fn={fn}
              getComponent={getComponent}
              specActions={specActions}
              specSelectors={specSelectors}
              pathMethod={[path, method]}
              getConfigs={getConfigs}
            />

            {!tryItOutEnabled ? null :
              <OperationServers
                getComponent={getComponent}
                path={path}
                method={method}
                operationServers={operation.get("servers")}
                pathServers={specSelectors.paths().getIn([path, "servers"])}
                getSelectedServer={oas3Selectors.selectedServer}
                setSelectedServer={oas3Actions.setSelectedServer}
                setServerVariableValue={oas3Actions.setServerVariableValue}
                getServerVariable={oas3Selectors.serverVariableValue}
                getEffectiveServerValue={oas3Selectors.serverEffectiveValue}
              />
            }

            {!tryItOutEnabled || !allowTryItOut ? null : schemes && schemes.size ? <div className="opblock-schemes">
              <Schemes schemes={schemes}
                path={path}
                method={method}
                specActions={specActions}
                currentScheme={operationScheme} />
            </div> : null
            }

            <div className="wrapper">
              <div className="col execute-wrapper">
                {!tryItOutEnabled || !allowTryItOut ? null :

                  <Execute
                    operation={operation}
                    specActions={specActions}
                    specSelectors={specSelectors}
                    path={path}
                    method={method}
                    onExecute={onExecute}
                  />
                }

                {(!tryItOutEnabled || !response || !allowTryItOut) ? null :
                  <Clear
                    specActions={specActions}
                    path={path}
                    method={method} />
                }
              </div>

            </div>

          </div>

        </div>

        <div className="col end">

          {executeInProgress ? <div className="loading-container"><div className="loading"></div></div> : null}
          {!responses ? null :
            <Responses
              responses={responses}
              request={request}
              har={har}
              tryItOutResponse={response}
              getComponent={getComponent}
              getConfigs={getConfigs}
              specSelectors={specSelectors}
              oas3Actions={oas3Actions}
              specActions={specActions}
              produces={produces}
              producesValue={operation.get("produces_value")}
              specPath={specPath.push("responses")}
              path={path}
              method={method}
              displayRequestDuration={displayRequestDuration}
              fn={fn} />
          }
        </div>

        {!showExtensions || !extensions.size ? null :
          <OperationExt extensions={extensions} getComponent={getComponent} />
        }
      </div>

    )
  }

}
