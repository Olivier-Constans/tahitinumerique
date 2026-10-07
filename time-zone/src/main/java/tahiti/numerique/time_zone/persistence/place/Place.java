package tahiti.numerique.time_zone.persistence.place;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import tahiti.numerique.time_zone.persistence.audit.Audit;
import tahiti.numerique.time_zone.persistence.audit.AuditListener;
import tahiti.numerique.time_zone.persistence.audit.Auditable;

import java.time.ZoneId;

/**
 * Lieu dont on calcule l'heure locale. Les implémentations sont stockées dans une seule table,
 * distinguées par la colonne {@value #TYPE_COLUMN}.
 */
@Entity
@Table(name = Place.TABLE)
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = Place.TYPE_COLUMN, length = Place.TYPE_MAX_LENGTH)
@EntityListeners(AuditListener.class)
@NoArgsConstructor
@Getter
@Setter
@FieldNameConstants
public abstract class Place implements Auditable {

    public static final String TABLE = "place";
    public static final String TYPE_COLUMN = "place_type";
    public static final int TYPE_MAX_LENGTH = 30;
    public static final int LABEL_MAX_LENGTH = 100;

    @Id
    @GeneratedValue
    private Long id;

    @Embedded
    private Audit audit;

    @Column(nullable = false, length = LABEL_MAX_LENGTH)
    private String label;

    public abstract String getType();

    public abstract ZoneId toZoneId();
}
