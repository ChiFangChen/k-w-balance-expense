import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faScaleBalanced, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { useApp } from '../context/AppContext'

export function OperationLogs() {
  const { state } = useApp()
  const { operationLogs } = state

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="page logs-page">
      <header className="page-header">
        <h1>操作紀錄</h1>
      </header>

      <div className="log-list">
        {operationLogs.length === 0 && (
          <div className="empty-state">還沒有操作紀錄</div>
        )}
        {operationLogs.map((log) => (
          <div key={log.id} className="log-item">
            <div className="log-header">
              <span className={`log-type ${log.type}`}>
                {log.type === 'balance' ? <><FontAwesomeIcon icon={faScaleBalanced} /> 平衡</> : <><FontAwesomeIcon icon={faTrashCan} /> 重置</>}
              </span>
              <span className="log-date">{formatDate(log.timestamp)}</span>
            </div>
            <div className="log-details">
              <div className="log-before">
                <span className="log-label">之前</span>
                <span>K: ${log.beforeKiki.toLocaleString()}</span>
                <span>W: ${log.beforeWayne.toLocaleString()}</span>
              </div>
              <div className="log-arrow">→</div>
              <div className="log-after">
                <span className="log-label">之後</span>
                <span>K: ${log.afterKiki.toLocaleString()}</span>
                <span>W: ${log.afterWayne.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
