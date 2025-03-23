;; Variety Registration Contract
;; Records details of locally adapted crop varieties

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u403))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-EXISTS (err u409))

;; Data structures
(define-map varieties
  { variety-id: uint }
  {
    owner: principal,
    name: (string-ascii 100),
    species: (string-ascii 100),
    family: (string-ascii 50),
    origin: (string-ascii 200),
    description: (string-ascii 500),
    characteristics: (string-ascii 500),
    cultivation-history: (string-ascii 500),
    images: (string-ascii 500),
    registration-date: uint,
    verification-status: bool
  }
)

(define-map verifiers
  { address: principal }
  { is-verifier: bool }
)

(define-data-var last-variety-id uint u0)

;; Public functions
(define-public (register-variety
                (name (string-ascii 100))
                (species (string-ascii 100))
                (family (string-ascii 50))
                (origin (string-ascii 200))
                (description (string-ascii 500))
                (characteristics (string-ascii 500))
                (cultivation-history (string-ascii 500))
                (images (string-ascii 500)))
  (let ((new-id (+ (var-get last-variety-id) u1)))
    (var-set last-variety-id new-id)
    (map-set varieties
      { variety-id: new-id }
      {
        owner: tx-sender,
        name: name,
        species: species,
        family: family,
        origin: origin,
        description: description,
        characteristics: characteristics,
        cultivation-history: cultivation-history,
        images: images,
        registration-date: block-height,
        verification-status: false
      }
    )
    (ok new-id)
  )
)

(define-public (update-variety
                (variety-id uint)
                (name (string-ascii 100))
                (species (string-ascii 100))
                (family (string-ascii 50))
                (origin (string-ascii 200))
                (description (string-ascii 500))
                (characteristics (string-ascii 500))
                (cultivation-history (string-ascii 500))
                (images (string-ascii 500)))
  (match (map-get? varieties { variety-id: variety-id })
    variety
      (if (is-eq tx-sender (get owner variety))
        (begin
          (map-set varieties
            { variety-id: variety-id }
            (merge variety {
              name: name,
              species: species,
              family: family,
              origin: origin,
              description: description,
              characteristics: characteristics,
              cultivation-history: cultivation-history,
              images: images
            })
          )
          (ok variety-id)
        )
        ERR-NOT-AUTHORIZED
      )
    ERR-NOT-FOUND
  )
)

(define-public (add-verifier (verifier principal))
  (if (is-eq tx-sender contract-caller)
    (begin
      (map-set verifiers { address: verifier } { is-verifier: true })
      (ok true)
    )
    ERR-NOT-AUTHORIZED
  )
)

(define-public (verify-variety (variety-id uint) (verified bool))
  (match (map-get? verifiers { address: tx-sender })
    verifier
      (if (get is-verifier verifier)
        (match (map-get? varieties { variety-id: variety-id })
          variety
            (begin
              (map-set varieties
                { variety-id: variety-id }
                (merge variety { verification-status: verified })
              )
              (ok variety-id)
            )
          ERR-NOT-FOUND
        )
        ERR-NOT-AUTHORIZED
      )
    ERR-NOT-AUTHORIZED
  )
)

;; Read-only functions
(define-read-only (get-variety (variety-id uint))
  (map-get? varieties { variety-id: variety-id })
)

(define-read-only (is-variety-verified (variety-id uint))
  (match (map-get? varieties { variety-id: variety-id })
    variety (ok (get verification-status variety))
    (err u404)
  )
)

(define-read-only (get-last-variety-id)
  (var-get last-variety-id)
)
