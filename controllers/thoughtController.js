const { User, Thought } = require('../models');

module.exports = {
  // Get all thoughts
  getThoughts(req, res) {
    Thought.find()
      .select('-__v')
      .then(async (thoughts) => {
        res.json(thoughts);
      })
      .catch((err) => {
        return res.status(500).json(err);
      });
  },
  // Get thought by id
  getSingleThought(req, res) {
    Thought.findOne({ _id: req.params.thoughtId })
      .select('-__v')
      .then(async (thought) => (!thought ? res.status(404).json({ message: 'No thought with this ID' }) : res.json(thought)))
      .catch((err) => {
        return res.status(500).json(err);
      });
  },
  // create a new thought with usernam
  createThought(req, res) {
    Thought.create(req.body)

      .then((thought) => {
        return User.findOneAndUpdate(
          // find username
          { username: req.body.username },
          { $addToSet: { thoughts: thought._id } },
          { new: true }
        )
          .select('-__v')
          .populate('thoughts');
      })
      .then((user) =>
        !user
          ? // invalid username
            res.status(404).json({ message: 'invalid username' })
          : res.json({ message: 'Success!', user })
      )
      .catch((err) => res.status(500).json(err));
  },
  async updateThought(req, res) {
    const user = await User.findOne({ username: req.body.username }).exec();

    if (!user) {
      res.status(404).json('username does not exist');
      return;
    }

    Thought.findOneAndUpdate(
      // find thought by thought id
      { _id: req.params.thoughtId },
      { $set: req.body },
      { runValidators: true, new: true }
    )
      .then((thought) => (!thought ? res.status(404).json({ message: 'No thought with this id!' }) : res.json(thought)))
      .catch((err) => res.status(500).json(err));
  },
  // Delete a thought by id
  async deleteThought(req, res) {
    Thought.findOneAndRemove({ _id: req.params.thoughtId })
      .then((thought) =>
        !thought
          ? // if no thought found, return error message
            res.status(404).json({ message: 'no thought available' })
          : // update thought
            User.findOneAndUpdate(
              // find user by username
              { username: thought.username },
              { $pull: { thoughts: req.params.thoughtId } },
              { new: true }
            )
      )
      .then((user) => (!user ? res.status(404).json({ message: ' no users found' }) : res.json({ message: 'Thought successfully deleted' })))
      .catch((err) => {
        res.status(500).json(err);
      });
  },

  // Add a reaction to a thought
  async addReaction(req, res) {
    Thought.findOneAndUpdate(
      // find user this matches the username
      { _id: req.params.thoughtId },
      { $addToSet: { reactions: req.body } },
      { new: true }
    )
      .select('-__v')
      .populate('reactions')
      .then((thought) =>
        !thought
          ? // no thought
            res.status(404).json({ message: 'no thought found' })
          : res.json({ message: 'Success!', thought })
      )
      .catch((err) => res.status(500).json(err));
  },

  // Remove reaction from a thought
  async removeReaction(req, res) {
    Thought.findOneAndUpdate(
      // find thought with id this matches thoughtId
      { _id: req.params.thoughtId },
      { $pull: { reactions: { _id: req.params.reactionId } } },
      { new: true }
    )
      .select('-__v')
      .populate('reactions')
      .then((thought) =>
        !thought
          ? res.status(404).json({ message: 'Reaction deleted' }) // success message
          : res.json({ message: 'successfully deleted' })
      )
      .catch((err) => res.status(500).json(err));
  }
};