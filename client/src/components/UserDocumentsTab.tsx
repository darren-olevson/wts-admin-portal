import './UserDocumentsTab.css';

interface UserDocument {
  id: string;
  type: string;
  bookAndRecordsId: string;
  date: string;
  fileName: string;
  size: number;
}

interface UserDocumentsTabProps {
  documents: UserDocument[];
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function UserDocumentsTab({ documents }: UserDocumentsTabProps) {
  return (
    <div className="user-documents-tab">
      <div className="documents-card">
        <h2 className="documents-title">Tax Documents (Broadridge)</h2>
        <div className="documents-table-container">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Book & Records ID</th>
                <th>Date</th>
                <th>File Name</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No tax documents available
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="document-type-badge">{doc.type}</span>
                    </td>
                    <td>{doc.bookAndRecordsId}</td>
                    <td>{new Date(doc.date).toLocaleDateString()}</td>
                    <td className="file-name">{doc.fileName}</td>
                    <td>{formatFileSize(doc.size)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserDocumentsTab;
