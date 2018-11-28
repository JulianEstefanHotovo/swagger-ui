import KongOperations from "../../kongComponents/Operations"
import KongOperationContainer from "../../kongComponents/OperationContainer"
import KongOperation from "../../kongComponents/Operation"
import KongParameters from "../../kongComponents/Parameters"
import KongParameterRow from "../../kongComponents/Parameter-row"
import KongModelExample from "../../kongComponents/model-example"
import KongParamBody from "../../kongComponents/param-body"
import KongContentType from "../../kongComponents/content-type"
import KongValidator from "../../kongComponents/online-validator-badge"

export default function () {

  let kongComponents = {
    components: {
      KongOperations,
      KongOperationContainer,
      KongOperation,
      KongParameters,
      KongParameterRow,
      KongModelExample,
      KongParamBody,
      KongContentType,
      KongValidator,
    }
  }

  return [
    kongComponents
  ]
}
