package tahiti.numerique.time_zone.persistence.audit;

import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.RequiredArgsConstructor;

import java.time.Clock;
import java.time.Instant;

@RequiredArgsConstructor
public class AuditListener {
	
	private final Clock clock;
	
	@PrePersist
    public void setCreatedOn(Auditable auditable) {
        Audit audit = auditable.getAudit();
        
        if(audit ==  null) {
        	audit = new Audit();
        	auditable.setAudit(audit);
        }
        
        audit.setCreateDate(Instant.now(clock));
        audit.setUpdateDate(Instant.now(clock));
	}
	
	@PreUpdate
	public void setUpdateOn(Auditable auditable) {
		Audit audit = auditable.getAudit();
		audit.setUpdateDate(Instant.now(clock));
	}

}
