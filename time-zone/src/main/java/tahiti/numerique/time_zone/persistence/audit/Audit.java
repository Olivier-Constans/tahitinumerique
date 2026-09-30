package tahiti.numerique.time_zone.persistence.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

import java.time.Instant;

@Data
@Embeddable
public class Audit {
	
	@Column(name = "create_date", nullable = false, updatable = false)
	private Instant createDate;
	
	@Column(name = "update_date", nullable = false)
	private Instant updateDate;
	
}
