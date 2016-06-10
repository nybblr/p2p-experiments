title: P2P
author:
  name: Jonathan Martin
  twitter: nybblr
output: presentation.html
controls: false

--

<style type="text/css">
  .figure {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background-size: contain;
    background-repeat: none;
    background-repeat: no-repeat;
    background-position: center;
  }
</style>

# I'm offline, dear.
## Electron + WebRTC + CRDTs

--

# Google Docs--

--

# 1992: JavaScript
## Marquees please? Sign my guestbook!

--

# 2016: JavaScript
## Forms, my foot! Let's build a desktop app.

--

# 1992: Internet
## Dial-up mo-bee-boo-BLEEEEP

--

# 2016: Internet
## Hotel WiFi. 'Nuff said.

--

# 2016: Internet
## Half Dome WiFi. The WiFi of nomads!

--

### I'm tired of waiting, love.

Internet is slow, because **the speed of light is slow.** Routers are slow. Computers are slow.

And deadlocking operations on a text document is infuriating. Turn-taking is for children.

Let's apply operations immediately, and handle merge hiccups later.

--

# ACID vs. BASE
## I'd like mine without lemon, please.

--

### Let's compromise.

Give up immediate consistency so we can have availability. Just **guarantee eventual consistency.**

--

# Merge
## Bob likes sandwiches, Alice doesn't. Resolve!

--

### Set Collaboration

Alice and Bob start a grocery list:

- Milk
- Bread
- Eggs

--

### Five minutes later...

Alice has:

- Milk
- Eggs
- Apples

Bob has:

- Eggs
- Bread

--

### How do we merge the changes?

We could union the sets:

- Milk
- Eggs
- Apples
- Bread

Or intersect them:

- Eggs

--

# Intersection...
## ...is a pretty useless merge strategy.

--

# Union...
## ...is monotonically increasing.

--

### Hey, I don't want bread!

Alice removed bread from the list, but because it was still in Bob's list, it "reappeared." So the union approach is pretty useless: we can never remove items!

We can't tell who cares about what and how items are added or removed. **We need more information.**

--

# State vs. Ops
## What if we could merge operations, instead of state?

--

### Grocery List Operations

Alice has:

- `REMOVE "bread"`
- `INSERT "apples"`

Bob has:

- `REMOVE "milk"`

--

### Sandwich and Lactose Intolerant

Running these ops on our start state yields:

- Eggs
- Apples

This is intuitively better than the UNION or INTERSECT strategies because **it preserves intention over state.**

--

### But now...

Neither party knows the other's full state. Will they always converge? What if Alice did:

- `REMOVE "bread"`
- `INSERT "apples"`

Bob did:

- `REMOVE "milk"`
- `INSERT "bread"`

--

### Break ties, the same way.

We might attach timestamps to each operation, and "simulate" running our unioned operations all over again on the common state.

It's not always a great strategy (some `REMOVE` and `INSERT` ops will be no-ops in the new history)...

...but at least **it will converge on both machines** since they will have the same common state + operation list.

--

### But, Special Relativity!

Light takes time, can we trust Alice and Bob's timestamps?

We still need a central clock that issues us timestamps and resolves ties.

--

# Sequences
## Sets are easy, what about text documents?

--

### Alice & Bob are sandwich historians.

**Sandwiches** are a popular type of lunch food, taken to work, school, or picnics to be eaten as part of a packed lunch.

Said to be a reference to John Montagu, *Fourth Earl Sandwich,* who was said to be an inveterate gambler who ate slices of cold meat between bread at the gaming table during marathon sessions rather than get up for a proper meal.

--

### Abridged sandwich history.

**Sandwiches** are a popular type of lunch food, taken to work, school, or picnics to be eaten as part of a packed lunch.

--

### Super-abridged sandwich history.

**sandwich**

--

### Make some history.

Alice changes:

`sandwich => sanwich`

Bob changes:

`sandwich => sandwhich`

--

### What changed?

Merging states is messy and loses important information for preserving intention. **Let's model this as operations!**

Alice: `sandwich => sanwich`

- `REMOVE(3)`

Bob: `sandwich => sandwhich`

- `INSERT(5, "h")`

--

### Merge which wiches?

Alice and Bob sync up, what should we do? Merge operations and run it forward!

- `REMOVE(3)`
- `INSERT(5, "h")`

`sandwich => sanwihch`

--

### No no no, you missed my intention!

We expected to get `sandwich => sanwhich`, but Bob's `INSERT` operation was executed without the `REMOVE` operation in mind.

They were created on two different states of the document, what to do?

--

### Transform remote operations.

Alice and Bob sync up, **but they transform the other's operations first** based on local operations.

- `REMOVE(3)` *# offsets new operations by -1*
- `INSERT(5, "h") => INSERT(5 - 1, "h") => INSERT(4, "h")`

`sandwich => sanwhich`

--

# OT
## Operational Transforms. Good enough for...two peers.

--

### A tale of two teepees.

**TP1:**

> *op1 ∘ T(op2, op1) ≡ op2 ∘ T(op1, op2)*

**TP2:**

> *T(op3, op1 ∘ T(op2, op1)) =  
> T(op3, op2 ∘ T(op1, op2))*

--

<div class="figure" style="background-image: url(tp1-problem.png);"></div>

--

<div class="figure" style="background-image: url(tp1-solution.png);"></div>

--

<div class="figure" style="background-image: url(tp2-problem.png);"></div>

--

*"Therefore, currently **there are no correct transformation functions** and consequently the operational transformation cannot be used to build a safe decentralized collaborative editing system."*

*"Unfortunately, implementing OT sucks. There's a million algorithms with different tradeoffs, mostly trapped in academic papers. **The algorithms are really hard and time consuming to implement correctly.** ... Wave took 2 years to write and if we rewrote it today, **it would take almost as long to write a second time."***

--

### Can me and my friends collaborate?

**No.** Operational Transforms are only for two peers.

Buuuut you can have a **central server** that "rebases" incoming remote operations, and pretend that the server is your only friend.

It's complicated, and slow, and takes fast infrastructure =(

**Meet Google Docs.**

--

### No more friends for you.

The inherent problem with OTs is that operations do not commute, so they must be transformed. Transformation is hard and rarely correct.

Unless... what if we had **a data structure whose operations never conflict by nature,** and doesn't require a master node?

Then your server could just be a standard peer and do "backups," and you wouldn't have to wait on it to rebase remote operations.

--

# CRDT
## Conflict-free Replicated Data Types

--

### CCI

- Causality
- Convergence
- Intention

--

### PCI

- Precondition
- Convergence
- Intention

--

# POSET
## It's just a partially ordered set, easy!
## ...or a directed acyclic graph

--

### Precondition vs. Causality

A precondition ensures an operation is only executed when the local state is similar to that of the remote system which generated the operation.

In essence, we're encoding a little more information with our operations: **context.**

--

# Not so fast.
## Canonical CRDT data structures don't include sequences.

--

### Fear not, academia has offerings.

**W00T:** Without Operational Transformations

Pros:

- Tombstones
- No vector clock
- No central server
- Low(ish) memory
- Simple!

--

### Fear not, academia has offerings.

**W00T:** Without Operational Transformations

Cons:

- Tombstones
- High(ish) memory

--

### I have a better idea.

**LSEQ:** Linear Sequence

Pros:

- No tombstones
- Fast traversal
- Low (sub-linear) memory
- Simple... to use!
- It's just a data structure!

--

# So... P2P?
## Half Dome, disaster areas... kinda need a connection.

--

### Collaboration Stack

- Duplex Stream
- Propagation Network
- Merge Algorithm

--

### Duplex Stream

- connection (wifi, socket, ble, sound)
- transport (tcp, udp, sctp)
- protocol (http, https, stream)
- discovery (mdns)
- resolver (ice, stun, turn)
- signaling, negotiation (webrtc)
- security (ssl, dtls)

--

### Propagation Network

- central relay server
- gossip protocol
- causal broadcast network
- version vectors

--

### Merge Algorithm

- Last one wins
- OT
- W00T
- CRDT + LSEQ

--

# Oh, & an editor.
## The "easiest" part, right?

--

# Electron
## Node.js + WebKit + Desktop app? Yes please!

--

### Stretch goals

- Support multiple collaborators at network level
- Standard discovery plugin architecture
- Auto transport switching
- Gossip protocol (CRATE) with ad hoc network
- Use CRDT + LSEQ (CRATE)
- Lines vs. characters
- Rich text editor
- Another datatype, even JSON!

--

# Applications
## Why is distributed computing strategic for BNR?

--

### Applications

- Disaster recovery
- P2P Raisin!
- Poor WiFi at our bootcamps
- Nomadic tooling
- Speed and offline resilience

--

# Why the Web?
## I mean, JavaScript is just a browser thing...

--

### JavaScript is ubiquitous.

- Available on all platforms
  - Browsers
  - Node.js
  - Desktop
  - Cordova
  - IoT
- Insanely good at IO + Networking
  - ICE, SSL, DTLS, SCTP, HTTP2

--

### JavaScript is ubiquitous.

- Inherently distributed
- Largest active programming community
- Largest library of libraries
- Faaaaast: 68% native speed in 2013!
- More at the JibberJabber =)

<!-- &#45;&#45; -->
<!--  -->
<!-- &#45; Glen -->
<!-- &#45; Project idea: pair devices (over WebRTC, Bluetooth, mDNS, etc) with QR codes! Point phone facetime cameras at each other, or use audio, and done! Or use NFC/BLE to negotiate P2P connection. -->
<!--  -->
<!-- We have a case of **Causal** vs. **Concurrent** operations. -->
