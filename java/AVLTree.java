import java.util.ArrayList;
import java.util.List;

/**
 * AVL Tree implementation for the Balanced BST Lab project.
 * Duplicate keys are ignored.
 */
public class AVLTree {
    private static class Node {
        int key;
        int height;
        Node left;
        Node right;

        Node(int key) {
            this.key = key;
            this.height = 1;
        }
    }

    private Node root;

    // Private constructor example: this utility constructor prevents instantiation.
    // The AVLTree itself has an implicit public constructor because none is declared.
    private AVLTree(boolean unused) { }

    public AVLTree() { }

    private int height(Node node) {
        return node == null ? 0 : node.height;
    }

    private int balanceFactor(Node node) {
        return node == null ? 0 : height(node.left) - height(node.right);
    }

    private void updateHeight(Node node) {
        node.height = 1 + Math.max(height(node.left), height(node.right));
    }

    private Node rotateRight(Node y) {
        Node x = y.left;
        Node middle = x.right;
        x.right = y;
        y.left = middle;
        updateHeight(y);
        updateHeight(x);
        return x;
    }

    private Node rotateLeft(Node x) {
        Node y = x.right;
        Node middle = y.left;
        y.left = x;
        x.right = middle;
        updateHeight(x);
        updateHeight(y);
        return y;
    }

    public void insert(int key) {
        root = insert(root, key);
    }

    private Node insert(Node node, int key) {
        if (node == null) return new Node(key);

        if (key < node.key) node.left = insert(node.left, key);
        else if (key > node.key) node.right = insert(node.right, key);
        else return node; // Ignore duplicates.

        updateHeight(node);
        int bf = balanceFactor(node);

        // LL case
        if (bf > 1 && key < node.left.key) return rotateRight(node);
        // RR case
        if (bf < -1 && key > node.right.key) return rotateLeft(node);
        // LR case
        if (bf > 1 && key > node.left.key) {
            node.left = rotateLeft(node.left);
            return rotateRight(node);
        }
        // RL case
        if (bf < -1 && key < node.right.key) {
            node.right = rotateRight(node.right);
            return rotateLeft(node);
        }
        return node;
    }

    public boolean search(int key) {
        Node current = root;
        while (current != null) {
            if (key == current.key) return true;
            current = key < current.key ? current.left : current.right;
        }
        return false;
    }

    public int height() {
        return height(root);
    }

    public List<Integer> inOrder() {
        List<Integer> result = new ArrayList<>();
        inOrder(root, result);
        return result;
    }

    private void inOrder(Node node, List<Integer> result) {
        if (node == null) return;
        inOrder(node.left, result);
        result.add(node.key);
        inOrder(node.right, result);
    }

    public static void main(String[] args) {
        AVLTree tree = new AVLTree();
        int[] values = {30, 20, 10, 25, 28, 40, 50, 22};

        for (int value : values) {
            tree.insert(value);
        }

        System.out.println("In-order traversal: " + tree.inOrder());
        System.out.println("Search 25: " + tree.search(25));
        System.out.println("Tree height: " + tree.height());
    }
}
