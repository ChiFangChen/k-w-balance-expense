import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faScaleBalanced, faTrashCan, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { useApp } from '../context/AppContext'
import { formatDate } from '../utils/date'

export function OperationLogs() {
  const { state } = useApp()
  const { operationLogs, settings } = state
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const fmt = (iso: string) => formatDate(iso, settings.timezone)

  return (
    <div className="page logs-page">
      <header className="page-header">
        <h1>操作紀錄</h1>
      </header>

      <div className="log-list">
        {operationLogs.length === 0 && (
          <div className="empty-state">還沒有操作紀錄</div>
        )}
        {operationLogs.map((log) => {
          const isExpanded = expandedId === log.id
          return (
            <div key={log.id} className={`log-item ${isExpanded ? 'log-item-expanded' : ''}`}>
              <div className="log-header" onClick={() => toggleExpand(log.id)}>
                <span className={`log-type ${log.type}`}>
                  {log.type === 'balance' ? <><FontAwesomeIcon icon={faScaleBalanced} /> 平衡</> : <><FontAwesomeIcon icon={faTrashCan} /> 重置</>}
                </span>
                <div className="log-header-right">
                  <span className="log-date">{fmt(log.timestamp)}</span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`log-chevron ${isExpanded ? 'log-chevron-open' : ''}`}
                  />
                </div>
              </div>

              <div className={`log-accordion ${isExpanded ? 'log-accordion-open' : ''}`}>
                <div className="log-accordion-inner">
                  <div className="log-details">
                    <div className="log-before">
                      <span className="log-label">之前</span>
                      <span>K: ${Math.ceil(log.beforeKiki).toLocaleString()}</span>
                      <span>W: ${Math.ceil(log.beforeWayne).toLocaleString()}</span>
                    </div>
                    <div className="log-arrow">→</div>
                    <div className="log-after">
                      <span className="log-label">之後</span>
                      <span>K: ${Math.ceil(log.afterKiki).toLocaleString()}</span>
                      <span>W: ${Math.ceil(log.afterWayne).toLocaleString()}</span>
                    </div>
                  </div>

                  {log.snapshot && log.snapshot.length > 0 && (
                    <div className="log-snapshot">
                      <div className="log-snapshot-title">當時帳目</div>
                      <div className="log-snapshot-list">
                        {log.snapshot.map((item, idx) => (
                          <div key={idx} className="log-snapshot-item">
                            <span
                              className={`payer-badge ${item.payer === 'Kiki' ? 'kiki' : 'wayne'}`}
                              style={{ width: '1.5rem', height: '1.5rem', fontSize: '0.625rem' }}
                            >
                              {item.payer[0]}
                            </span>
                            <span className="log-snapshot-name">{item.item}</span>
                            <span className="log-snapshot-amount">
                              {item.currency !== settings.defaultCurrency
                                ? `${item.currency} ${item.amount.toLocaleString()}`
                                : `$${item.amount.toLocaleString()}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
