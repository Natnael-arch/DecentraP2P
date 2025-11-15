// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract P2PEscrow {
    enum TradeStatus {
        None,
        AwaitingSellerLock,
        Locked,
        Paid,
        Released,
        Refunded
    }

    struct Listing {
        uint256 id;
        address seller;
        uint256 availableAmount;
        uint256 price;
        bool active;
    }

    struct Trade {
        uint256 id;
        uint256 listingId;
        address seller;
        address buyer;
        uint256 amount;
        uint256 timeout;
        TradeStatus status;
    }

    IERC20 public immutable stablecoin;
    uint256 public immutable paymentTimeout; // seconds

    uint256 public listingCounter;
    uint256 public tradeCounter;

    mapping(uint256 => Listing) private _listings;
    mapping(uint256 => Trade) private _trades;

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 price);
    event ListingDeactivated(uint256 indexed listingId);
    event TradeStarted(uint256 indexed tradeId, uint256 indexed listingId, address indexed buyer, uint256 amount);
    event FundsLocked(uint256 indexed tradeId, address indexed seller, uint256 amount);
    event TradeMarkedPaid(uint256 indexed tradeId, address indexed buyer, uint256 timeout);
    event TradeReleased(uint256 indexed tradeId, address indexed buyer, uint256 amount);
    event TradeRefunded(uint256 indexed tradeId, address indexed seller, uint256 amount);

    error InvalidAmount();
    error ListingInactive();
    error InsufficientLiquidity();
    error Unauthorized();
    error InvalidStatus(TradeStatus current, TradeStatus expected);
    error TimeoutNotReached();
    error ListingNotFound();
    error TradeNotFound();

    modifier nonReentrant() {
        require(_status != _ENTERED, "reentrancy");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(IERC20 stablecoin_, uint256 paymentTimeout_) {
        require(address(stablecoin_) != address(0), "stablecoin required");
        require(paymentTimeout_ >= 5 minutes, "timeout too short");
        stablecoin = stablecoin_;
        paymentTimeout = paymentTimeout_;
    }

    /* ========== Listing CRUD ========== */

    function createListing(uint256 amount, uint256 price) external returns (uint256 listingId) {
        if (amount == 0) revert InvalidAmount();
        listingId = ++listingCounter;
        _listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            availableAmount: amount,
            price: price,
            active: true
        });
        emit ListingCreated(listingId, msg.sender, amount, price);
    }

    function deactivateListing(uint256 listingId) external {
        Listing storage listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound();
        if (listing.seller != msg.sender) revert Unauthorized();
        listing.active = false;
        emit ListingDeactivated(listingId);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        Listing memory listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound();
        return listing;
    }

    function getListings() external view returns (Listing[] memory) {
        Listing[] memory results = new Listing[](listingCounter);
        for (uint256 i = 0; i < listingCounter; i++) {
            results[i] = _listings[i + 1];
        }
        return results;
    }

    /* ========== Trade lifecycle ========== */

    function startTrade(uint256 listingId, uint256 amountRequested) external returns (uint256 tradeId) {
        if (amountRequested == 0) revert InvalidAmount();
        Listing storage listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound();
        if (!listing.active) revert ListingInactive();
        if (listing.availableAmount < amountRequested) revert InsufficientLiquidity();

        listing.availableAmount -= amountRequested;
        if (listing.availableAmount == 0) {
            listing.active = false;
        }

        tradeId = ++tradeCounter;
        _trades[tradeId] = Trade({
            id: tradeId,
            listingId: listingId,
            seller: listing.seller,
            buyer: msg.sender,
            amount: amountRequested,
            timeout: 0,
            status: TradeStatus.AwaitingSellerLock
        });

        emit TradeStarted(tradeId, listingId, msg.sender, amountRequested);
    }

    function sellerLockFunds(uint256 tradeId) external nonReentrant {
        Trade storage trade = _trades[tradeId];
        if (trade.id == 0) revert TradeNotFound();
        if (trade.seller != msg.sender) revert Unauthorized();
        if (trade.status != TradeStatus.AwaitingSellerLock) revert InvalidStatus(trade.status, TradeStatus.AwaitingSellerLock);

        bool transferred = stablecoin.transferFrom(msg.sender, address(this), trade.amount);
        require(transferred, "transferFrom failed");

        trade.status = TradeStatus.Locked;
        emit FundsLocked(tradeId, msg.sender, trade.amount);
    }

    function buyerMarkPaid(uint256 tradeId) external {
        Trade storage trade = _trades[tradeId];
        if (trade.id == 0) revert TradeNotFound();
        if (trade.buyer != msg.sender) revert Unauthorized();
        if (trade.status != TradeStatus.Locked) revert InvalidStatus(trade.status, TradeStatus.Locked);

        trade.status = TradeStatus.Paid;
        trade.timeout = block.timestamp + paymentTimeout;

        emit TradeMarkedPaid(tradeId, msg.sender, trade.timeout);
    }

    function sellerRelease(uint256 tradeId) external nonReentrant {
        Trade storage trade = _trades[tradeId];
        if (trade.id == 0) revert TradeNotFound();
        if (trade.seller != msg.sender) revert Unauthorized();
        if (trade.status != TradeStatus.Paid) revert InvalidStatus(trade.status, TradeStatus.Paid);

        trade.status = TradeStatus.Released;
        bool success = stablecoin.transfer(trade.buyer, trade.amount);
        require(success, "transfer failed");

        emit TradeReleased(tradeId, trade.buyer, trade.amount);
    }

    function triggerTimeoutRefund(uint256 tradeId) external nonReentrant {
        Trade storage trade = _trades[tradeId];
        if (trade.id == 0) revert TradeNotFound();
        if (trade.status != TradeStatus.Paid) revert InvalidStatus(trade.status, TradeStatus.Paid);
        if (block.timestamp < trade.timeout) revert TimeoutNotReached();

        trade.status = TradeStatus.Refunded;
        bool success = stablecoin.transfer(trade.seller, trade.amount);
        require(success, "transfer failed");

        emit TradeRefunded(tradeId, trade.seller, trade.amount);
    }

    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        Trade memory trade = _trades[tradeId];
        if (trade.id == 0) revert TradeNotFound();
        return trade;
    }

    function getTradesForUser(address user) external view returns (Trade[] memory) {
        uint256 count;
        for (uint256 i = 1; i <= tradeCounter; i++) {
            Trade storage trade = _trades[i];
            if (trade.seller == user || trade.buyer == user) {
                count++;
            }
        }

        Trade[] memory results = new Trade[](count);
        uint256 idx;
        for (uint256 i = 1; i <= tradeCounter; i++) {
            Trade storage trade = _trades[i];
            if (trade.seller == user || trade.buyer == user) {
                results[idx++] = trade;
            }
        }
        return results;
    }
}

