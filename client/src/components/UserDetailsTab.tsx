import './UserDetailsTab.css';

interface UserDetailsTabProps {
  user: {
    displayName: string;
    dateOfBirth: string;
    email: string;
    citizenship?: string;
    countryOfResidence: string;
    countryOfTaxResidence: string;
    phoneNumber?: string;
    address?: string;
  };
}

function UserDetailsTab({ user }: UserDetailsTabProps) {
  return (
    <div className="user-details-tab">
      <div className="details-card">
        <h2 className="details-title">User Details</h2>
        <div className="details-list">
          <div className="details-row">
            <span className="details-label">Full Name</span>
            <span className="details-value">{user.displayName}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Date of Birth</span>
            <span className="details-value">{user.dateOfBirth}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Email Address</span>
            <span className="details-value">{user.email}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Citizenship</span>
            <span className="details-value">{user.citizenship || 'N/A'}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Country of Residence</span>
            <span className="details-value">{user.countryOfResidence}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Country of Tax Residence</span>
            <span className="details-value">{user.countryOfTaxResidence}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Phone Number</span>
            <span className="details-value">{user.phoneNumber || 'N/A'}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Address</span>
            <span className="details-value">{user.address || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetailsTab;
