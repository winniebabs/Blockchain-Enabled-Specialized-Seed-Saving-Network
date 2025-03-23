;; Germination Testing Contract
;; Monitors viability of saved seeds

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u403))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-EXISTS (err u409))

;; Data structures
(define-map seed-batches
  { batch-id: uint }
  {
    owner: principal,
    variety-id: uint,
    harvest-date: uint,
    quantity: uint, ;; in grams
    storage-method: (string-ascii 100),
    storage-location: (string-ascii 200),
    notes: (string-ascii 500),
    registration-date: uint
  }
)

(define-map germination-tests
  { test-id: uint }
  {
    batch-id: uint,
    tester: principal,
    test-date: uint,
    seeds-tested: uint,
    seeds-germinated: uint,
    germination-rate: uint, ;; percentage * 100 for precision (e.g., 8500 = 85%)
    days-to-germination: uint,
    test-method: (string-ascii 100),
    test-conditions: (string-ascii 200),
    images: (string-ascii 500),
    notes: (string-ascii 500)
  }
)

(define-map viability-predictions
  { prediction-id: uint }
  {
    batch-id: uint,
    predicted-viability-date: uint, ;; date until seeds are expected to remain viable
    confidence-level: uint, ;; percentage * 100 for precision
    basis: (string-ascii 200), ;; e.g., "based on 3 germination tests"
    creator: principal,
    creation-date: uint
  }
)

(define-data-var last-batch-id uint u0)
(define-data-var last-test-id uint u0)
(define-data-var last-prediction-id uint u0)

;; Public functions
(define-public (register-seed-batch
                (variety-id uint)
                (harvest-date uint)
                (quantity uint)
                (storage-method (string-ascii 100))
                (storage-location (string-ascii 200))
                (notes (string-ascii 500)))
  (let ((new-id (+ (var-get last-batch-id) u1)))
    (var-set last-batch-id new-id)
    (map-set seed-batches
      { batch-id: new-id }
      {
        owner: tx-sender,
        variety-id: variety-id,
        harvest-date: harvest-date,
        quantity: quantity,
        storage-method: storage-method,
        storage-location: storage-location,
        notes: notes,
        registration-date: block-height
      }
    )
    (ok new-id)
  )
)

(define-public (update-seed-batch
                (batch-id uint)
                (quantity uint)
                (storage-method (string-ascii 100))
                (storage-location (string-ascii 200))
                (notes (string-ascii 500)))
  (match (map-get? seed-batches { batch-id: batch-id })
    batch
      (if (is-eq tx-sender (get owner batch))
        (begin
          (map-set seed-batches
            { batch-id: batch-id }
            (merge batch {
              quantity: quantity,
              storage-method: storage-method,
              storage-location: storage-location,
              notes: notes
            })
          )
          (ok batch-id)
        )
        ERR-NOT-AUTHORIZED
      )
    ERR-NOT-FOUND
  )
)

(define-public (record-germination-test
                (batch-id uint)
                (seeds-tested uint)
                (seeds-germinated uint)
                (days-to-germination uint)
                (test-method (string-ascii 100))
                (test-conditions (string-ascii 200))
                (images (string-ascii 500))
                (notes (string-ascii 500)))
  (match (map-get? seed-batches { batch-id: batch-id })
    batch
      (let (
        (new-id (+ (var-get last-test-id) u1))
        (germination-rate (if (> seeds-tested u0)
                            (* (/ (* seeds-germinated u10000) seeds-tested) u1)
                            u0))
      )
        (var-set last-test-id new-id)
        (map-set germination-tests
          { test-id: new-id }
          {
            batch-id: batch-id,
            tester: tx-sender,
            test-date: block-height,
            seeds-tested: seeds-tested,
            seeds-germinated: seeds-germinated,
            germination-rate: germination-rate,
            days-to-germination: days-to-germination,
            test-method: test-method,
            test-conditions: test-conditions,
            images: images,
            notes: notes
          }
        )
        (ok new-id)
      )
    ERR-NOT-FOUND
  )
)

(define-public (create-viability-prediction
                (batch-id uint)
                (predicted-viability-date uint)
                (confidence-level uint)
                (basis (string-ascii 200)))
  (match (map-get? seed-batches { batch-id: batch-id })
    batch
      (let ((new-id (+ (var-get last-prediction-id) u1)))
        (var-set last-prediction-id new-id)
        (map-set viability-predictions
          { prediction-id: new-id }
          {
            batch-id: batch-id,
            predicted-viability-date: predicted-viability-date,
            confidence-level: confidence-level,
            basis: basis,
            creator: tx-sender,
            creation-date: block-height
          }
        )
        (ok new-id)
      )
    ERR-NOT-FOUND
  )
)

;; Read-only functions
(define-read-only (get-seed-batch (batch-id uint))
  (map-get? seed-batches { batch-id: batch-id })
)

(define-read-only (get-germination-test (test-id uint))
  (map-get? germination-tests { test-id: test-id })
)

(define-read-only (get-viability-prediction (prediction-id uint))
  (map-get? viability-predictions { prediction-id: prediction-id })
)

(define-read-only (get-latest-germination-rate (batch-id uint))
  ;; In a real implementation, this would query the most recent test for the batch
  ;; For simplicity, we're returning a default value
  (ok u0)
)

(define-read-only (is-batch-viable (batch-id uint))
  ;; In a real implementation, this would check if the batch is still viable
  ;; based on the latest germination test and predictions
  ;; For simplicity, we're returning a default value
  (ok true)
)

(define-read-only (calculate-seed-age (batch-id uint))
  (match (map-get? seed-batches { batch-id: batch-id })
    batch
      (ok (- block-height (get harvest-date batch)))
    (err u404)
  )
)

(define-read-only (get-last-batch-id)
  (var-get last-batch-id)
)

(define-read-only (get-last-test-id)
  (var-get last-test-id)
)

(define-read-only (get-last-prediction-id)
  (var-get last-prediction-id)
)
